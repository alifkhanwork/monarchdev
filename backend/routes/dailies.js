const express = require('express');
const DailyTask = require('../models/DailyTask');
const Workout = require('../models/Workout');
const { getPlayer } = require('../utils/getPlayer');
const { getWorkoutDayType, isSameDay } = require('../utils/dateHelpers');
const {
  calculateExpReward,
  applyExpAndLevelUp,
  revertExpAndLevelDown,
  incrementStat,
  decrementStat,
} = require('../utils/gameLogic');
const {
  processDayRollover,
  getTodayCompletionStatus,
  assertDayNotFrozen,
} = require('../utils/dayRollover');
const { appendStatHistory } = require('../utils/statHistory');
const {
  VALID_STATUSES,
  ensureTodayStatus,
  setTodayStatus,
  formatDayStatus,
} = require('../utils/dayStatus');
const {
  applyTaskLifetimeOnComplete,
  revertTaskLifetimeOnUncomplete,
  adjustTaskLifetimeLogValue,
  processWorkoutSync,
} = require('../utils/lifetimeTracking');

const formatWorkoutResponse = (workout, today) => ({
  _id: workout._id,
  dayType: workout.dayType,
  exercises: workout.exercises.map((ex) => ({
    _id: ex._id,
    name: ex.name,
    sets: ex.sets,
    repRange: ex.repRange,
    completed: ex.completed && isSameDay(ex.lastCompletedDate, today),
  })),
});

const formatWorkoutSyncResponse = (user, workout, syncResult, today) => ({
  workout: formatWorkoutResponse(workout, today),
  workoutFullyComplete: syncResult.workoutFullyComplete,
  badgesUnlocked: syncResult.badgesUnlocked,
  grindUpdates: syncResult.grindUpdates,
  taskReward: syncResult.taskReward,
  user: {
    level: user.level,
    currentExp: user.currentExp,
    expToNextLevel: user.expToNextLevel,
    stats: user.stats,
  },
});

const formatTask = (task, today) => {
  const completedToday =
    task.isCompleted && isSameDay(task.lastCompletedDate, today);
  return {
    _id: task._id,
    taskName: task.taskName,
    category: task.category,
    expReward: task.expReward,
    statModifier: task.statModifier,
    lifetimeMetric: task.lifetimeMetric || 'none',
    defaultLogValue: task.defaultLogValue ?? 1,
    logValue: task.logValue ?? task.defaultLogValue ?? 1,
    logUnit:
      task.lifetimeMetric === 'study_hours'
        ? 'hr'
        : task.lifetimeMetric === 'water_liters'
          ? 'L'
          : task.lifetimeMetric === 'distance_km'
            ? 'km'
            : null,
    isCompleted: completedToday,
    lastCompletedDate: task.lastCompletedDate,
  };
};

const router = express.Router();

const CATEGORY_ORDER = ['Foundation', 'Health', 'Mental', 'Professional'];

router.get('/', async (req, res) => {
  try {
    const user = await getPlayer();
    await processDayRollover(user);
    const refreshedUser = await getPlayer();

    const today = new Date();
    const dayType = getWorkoutDayType(today);
    const tasks = await DailyTask.find().sort({ category: 1, taskName: 1 });

    const dayStatus = ensureTodayStatus(refreshedUser);
    const statusInfo = formatDayStatus(dayStatus);
    const isFrozen = statusInfo.isFrozen;

    const tasksWithStatus = tasks.map((task) => formatTask(task, today));

    const groupedTasks = CATEGORY_ORDER.map((category) => ({
      category,
      tasks: tasksWithStatus.filter((t) => t.category === category),
    })).filter((group) => group.tasks.length > 0);

    const workout = await Workout.findOne({ dayType });
    const todayStatus = isFrozen ? { complete: false } : await getTodayCompletionStatus();
    const possibleExp = tasksWithStatus.reduce((sum, t) => sum + t.expReward, 0);
    const earnedExp = tasksWithStatus
      .filter((t) => t.isCompleted)
      .reduce((sum, t) => sum + t.expReward, 0);

    const penalty =
      !isFrozen && refreshedUser.pendingPenalty?.dismissed === false
        ? refreshedUser.pendingPenalty
        : null;

    res.json({
      date: today.toISOString(),
      dayType,
      dayStatus: statusInfo,
      freezeHistory: refreshedUser.freezeHistory || [],
      workout: workout
        ? {
            _id: workout._id,
            dayType: workout.dayType,
            exercises: workout.exercises.map((ex) => ({
              _id: ex._id,
              name: ex.name,
              sets: ex.sets,
              repRange: ex.repRange,
              completed: ex.completed && isSameDay(ex.lastCompletedDate, today),
            })),
          }
        : null,
      tasks: tasksWithStatus,
      groupedTasks,
      streak: {
        current: refreshedUser.currentStreak || 0,
        best: refreshedUser.bestStreak || 0,
      },
      todayExp: { earned: earnedExp, possible: possibleExp },
      dayComplete: todayStatus.complete,
      penalty,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dailies', error: error.message });
  }
});

router.patch('/day-status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid day status' });
    }

    const user = await getPlayer();
    setTodayStatus(user, status);
    await user.save();

    res.json({ dayStatus: formatDayStatus(status) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update day status', error: error.message });
  }
});

router.post('/complete/:id', async (req, res) => {
  try {
    const user = await getPlayer();
    assertDayNotFrozen(user);

    const task = await DailyTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const today = new Date();
    if (task.isCompleted && isSameDay(task.lastCompletedDate, today)) {
      return res.status(400).json({ message: 'Task already completed today' });
    }

    const expGained = calculateExpReward(task.expReward, task.statModifier);

    task.isCompleted = true;
    task.lastCompletedDate = today;
    await task.save();

    incrementStat(user, task.statModifier, 1);
    const levelUps = applyExpAndLevelUp(user, expGained);
    const badgesUnlocked = applyTaskLifetimeOnComplete(user, task);
    appendStatHistory(user, today);
    await user.save();

    res.json({
      message: 'Task completed',
      task: formatTask(task, today),
      expGained,
      levelUps,
      badgesUnlocked,
      user: {
        level: user.level,
        currentExp: user.currentExp,
        expToNextLevel: user.expToNextLevel,
        stats: user.stats,
      },
    });
  } catch (error) {
    const code = error.statusCode || 500;
    res.status(code).json({ message: error.message });
  }
});

router.post('/uncomplete/:id', async (req, res) => {
  try {
    const user = await getPlayer();
    assertDayNotFrozen(user);

    const task = await DailyTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const today = new Date();
    const completedToday =
      task.isCompleted && isSameDay(task.lastCompletedDate, today);
    if (!completedToday) {
      return res.status(400).json({ message: 'Task is not completed today' });
    }

    const expLost = calculateExpReward(task.expReward, task.statModifier);

    task.isCompleted = false;
    task.lastCompletedDate = null;
    revertTaskLifetimeOnUncomplete(user, task);
    await task.save();

    decrementStat(user, task.statModifier, 1);
    const levelDowns = revertExpAndLevelDown(user, expLost);
    appendStatHistory(user, today);
    await user.save();

    res.json({
      message: 'Task reverted',
      task: formatTask(task, today),
      expLost,
      levelDowns,
      user: {
        level: user.level,
        currentExp: user.currentExp,
        expToNextLevel: user.expToNextLevel,
        stats: user.stats,
      },
    });
  } catch (error) {
    const code = error.statusCode || 500;
    res.status(code).json({ message: error.message });
  }
});

router.post('/workout/:workoutId/exercise/:exerciseId', async (req, res) => {
  try {
    const user = await getPlayer();
    assertDayNotFrozen(user);

    const workout = await Workout.findById(req.params.workoutId);
    if (!workout) return res.status(404).json({ message: 'Workout not found' });

    const exercise = workout.exercises.id(req.params.exerciseId);
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });

    const today = new Date();
    const completedToday =
      exercise.completed && isSameDay(exercise.lastCompletedDate, today);

    exercise.completed = !completedToday;
    exercise.lastCompletedDate = exercise.completed ? today : null;
    await workout.save();

    const syncResult = await processWorkoutSync(user, workout);
    await user.save();

    res.json(formatWorkoutSyncResponse(user, workout, syncResult, today));
  } catch (error) {
    const code = error.statusCode || 500;
    res.status(code).json({ message: error.message });
  }
});

router.post('/workout/:workoutId/complete-all', async (req, res) => {
  try {
    const user = await getPlayer();
    assertDayNotFrozen(user);

    const workout = await Workout.findById(req.params.workoutId);
    if (!workout) return res.status(404).json({ message: 'Workout not found' });

    const today = new Date();
    for (const exercise of workout.exercises) {
      exercise.completed = true;
      exercise.lastCompletedDate = today;
    }
    await workout.save();

    const syncResult = await processWorkoutSync(user, workout);
    await user.save();

    res.json(formatWorkoutSyncResponse(user, workout, syncResult, today));
  } catch (error) {
    const code = error.statusCode || 500;
    res.status(code).json({ message: error.message });
  }
});

router.post('/workout/:workoutId/clear-all', async (req, res) => {
  try {
    const user = await getPlayer();
    assertDayNotFrozen(user);

    const workout = await Workout.findById(req.params.workoutId);
    if (!workout) return res.status(404).json({ message: 'Workout not found' });

    const today = new Date();
    for (const exercise of workout.exercises) {
      exercise.completed = false;
      exercise.lastCompletedDate = null;
    }
    await workout.save();

    const syncResult = await processWorkoutSync(user, workout);
    await user.save();

    res.json(formatWorkoutSyncResponse(user, workout, syncResult, today));
  } catch (error) {
    const code = error.statusCode || 500;
    res.status(code).json({ message: error.message });
  }
});

router.patch('/log-value/:id', async (req, res) => {
  try {
    const user = await getPlayer();
    assertDayNotFrozen(user);

    const task = await DailyTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (!task.lifetimeMetric || task.lifetimeMetric === 'none') {
      return res.status(400).json({ message: 'Task does not support log values' });
    }

    const { value } = req.body;
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) {
      return res.status(400).json({ message: 'Invalid log value' });
    }

    const oldValue = task.logValue ?? task.defaultLogValue ?? 1;
    task.logValue = parsed;
    const badgesUnlocked = adjustTaskLifetimeLogValue(user, task, parsed, oldValue);
    await task.save();
    await user.save();

    const today = new Date();
    res.json({
      task: formatTask(task, today),
      badgesUnlocked,
    });
  } catch (error) {
    const code = error.statusCode || 500;
    res.status(code).json({ message: error.message });
  }
});

module.exports = router;

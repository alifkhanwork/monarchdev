const express = require('express');
const DailyTask = require('../models/DailyTask');
const Workout = require('../models/Workout');
const { getPlayer } = require('../utils/getPlayer');
const { getWorkoutDayType, isSameDay } = require('../utils/dateHelpers');
const {
  calculateExpReward,
  applyExpAndLevelUp,
  revertExpAndLevelDown,
  normalizeStreaks,
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
  applyStepDelta,
  applyStatRewards,
  revertStatRewards,
  resolveTaskStatRewards,
} = require('../utils/lifetimeTracking');
const { isRecoveryDayType } = require('../utils/workoutRoutines');
const { saveWithRetry } = require('../utils/saveWithRetry');
const { getProgressMap } = require('../utils/progressService');
const { classifyModality } = require('../utils/progressiveOverload');

const formatExercise = (ex, today, progressMap = {}) => {
  const stepsToday = isSameDay(ex.lastStepsDate, today) ? ex.currentSteps || 0 : 0;
  const stepTarget = ex.stepTarget || 0;
  const isSteps = ex.trackingType === 'steps';
  const completed = isSteps
    ? stepsToday >= (stepTarget || 10000) &&
      ex.completed &&
      isSameDay(ex.lastCompletedDate, today)
    : ex.completed && isSameDay(ex.lastCompletedDate, today);

  const progress = progressMap[ex.name] || null;
  const modality = progress?.modality || classifyModality(ex.name);

  return {
    _id: ex._id,
    name: ex.name,
    sets: progress?.currentSets || ex.sets,
    repRange: progress?.currentRepRange || ex.repRange,
    completed,
    trackingType: ex.trackingType || 'none',
    stepTarget: isSteps ? stepTarget || 10000 : null,
    currentSteps: isSteps ? stepsToday : null,
    modality,
    currentWeightKg: progress?.currentWeightKg ?? null,
    nextRecommendedWeightKg: progress?.nextRecommendedWeightKg ?? null,
    progressStage: progress?.progressStage ?? null,
    coachNote: progress?.coachNote ?? null,
    lastPerformance: progress?.lastPerformance ?? null,
    bestPerformance: progress?.bestPerformance ?? null,
  };
};

const formatWorkoutResponse = (workout, today, progressMap = {}) => ({
  _id: workout._id,
  dayType: workout.dayType,
  isRecovery: isRecoveryDayType(workout.dayType),
  exercises: workout.exercises.map((ex) => formatExercise(ex, today, progressMap)),
  completionPercent: (() => {
    const list = workout.exercises;
    if (!list.length) return 0;
    const done = list.filter((ex) => formatExercise(ex, today, progressMap).completed).length;
    return Math.round((done / list.length) * 100);
  })(),
});

const formatWorkoutSyncResponse = (user, workout, syncResult, today, progressMap = {}) => ({
  workout: formatWorkoutResponse(workout, today, progressMap),
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
    category: task.category === 'Professional' ? 'Productivity' : task.category,
    expReward: task.expReward,
    statModifier: task.statModifier,
    statRewards: task.statRewards?.length
      ? task.statRewards
      : [{ stat: task.statModifier, amount: 1 }],
    lifetimeMetric: task.lifetimeMetric || 'none',
    defaultLogValue: task.defaultLogValue ?? 1,
    logValue: task.logValue ?? task.defaultLogValue ?? 1,
    logUnit:
      task.lifetimeMetric === 'study_hours' && task.taskName.toLowerCase().includes('10 min')
        ? 'min'
        : task.lifetimeMetric === 'study_hours'
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

const CATEGORY_ORDER = ['Health', 'Mental', 'Productivity', 'Professional', 'Foundation'];

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
      category: category === 'Professional' ? 'Productivity' : category,
      tasks: tasksWithStatus.filter((t) => {
        const cat = t.category === 'Professional' ? 'Productivity' : t.category;
        return cat === (category === 'Professional' ? 'Productivity' : category);
      }),
    }))
      .filter((group) => group.tasks.length > 0)
      // Dedupe Productivity if both Professional and Productivity keys map
      .reduce((acc, group) => {
        const existing = acc.find((g) => g.category === group.category);
        if (existing) {
          const ids = new Set(existing.tasks.map((t) => t._id));
          for (const t of group.tasks) {
            if (!ids.has(t._id)) existing.tasks.push(t);
          }
        } else {
          acc.push(group);
        }
        return acc;
      }, []);

    const workout = await Workout.findOne({ dayType });
    const progressMap = await getProgressMap();
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
      workout: workout ? formatWorkoutResponse(workout, today, progressMap) : null,
      tasks: tasksWithStatus,
      groupedTasks,
      streak: normalizeStreaks(refreshedUser),
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
    const rewards = resolveTaskStatRewards(task);

    task.isCompleted = true;
    task.lastCompletedDate = today;
    await task.save();

    applyStatRewards(user, rewards);
    const levelUps = applyExpAndLevelUp(user, expGained);
    const badgesUnlocked = await applyTaskLifetimeOnComplete(user, task);
    appendStatHistory(user, today);
    await saveWithRetry(user);

    res.json({
      message: 'Task completed',
      task: formatTask(task, today),
      expGained,
      statRewards: rewards,
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
    const rewards = resolveTaskStatRewards(task);

    task.isCompleted = false;
    task.lastCompletedDate = null;
    await revertTaskLifetimeOnUncomplete(user, task);
    await task.save();

    revertStatRewards(user, rewards);
    const levelDowns = revertExpAndLevelDown(user, expLost);
    appendStatHistory(user, today);
    await saveWithRetry(user);

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

    if (exercise.trackingType === 'steps') {
      return res.status(400).json({
        message: 'Use step tracking buttons for this exercise',
      });
    }

    const today = new Date();
    const completedToday =
      exercise.completed && isSameDay(exercise.lastCompletedDate, today);

    exercise.completed = !completedToday;
    exercise.lastCompletedDate = exercise.completed ? today : null;
    await workout.save();

    const syncResult = await processWorkoutSync(user, workout);
    await saveWithRetry(user);
    const progressMap = await getProgressMap();

    res.json(formatWorkoutSyncResponse(user, workout, syncResult, today, progressMap));
  } catch (error) {
    const code = error.statusCode || 500;
    res.status(code).json({ message: error.message });
  }
});

router.post('/workout/:workoutId/exercise/:exerciseId/steps', async (req, res) => {
  try {
    const user = await getPlayer();
    assertDayNotFrozen(user);

    const { validateStepDelta } = require('../utils/validateInput');
    let delta;
    try {
      delta = validateStepDelta(req.body?.delta);
    } catch (e) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }

    const workout = await Workout.findById(req.params.workoutId);
    if (!workout) return res.status(404).json({ message: 'Workout not found' });

    const exercise = workout.exercises.id(req.params.exerciseId);
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });

    const today = new Date();
    const stepResult = await applyStepDelta(user, exercise, delta, today);
    await workout.save();

    const syncResult = await processWorkoutSync(user, workout);
    await saveWithRetry(user);
    const progressMap = await getProgressMap();

    res.json({
      ...formatWorkoutSyncResponse(user, workout, syncResult, today, progressMap),
      stepResult,
    });
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
      if (exercise.trackingType === 'steps') {
        const target = exercise.stepTarget || 10000;
        const stepsToday = isSameDay(exercise.lastStepsDate, today)
          ? exercise.currentSteps || 0
          : 0;
        if (stepsToday < target) continue; // don't auto-fill steps
        exercise.completed = true;
        exercise.lastCompletedDate = today;
      } else {
        exercise.completed = true;
        exercise.lastCompletedDate = today;
      }
    }
    await workout.save();

    const syncResult = await processWorkoutSync(user, workout);
    await saveWithRetry(user);
    const progressMap = await getProgressMap();
    res.json(formatWorkoutSyncResponse(user, workout, syncResult, today, progressMap));
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
      if (exercise.trackingType === 'steps' && isSameDay(exercise.lastStepsDate, today)) {
        const prev = exercise.currentSteps || 0;
        if (prev > 0) {
          await applyStepDelta(user, exercise, -prev, today);
        }
      }
      exercise.completed = false;
      exercise.lastCompletedDate = null;
    }
    await workout.save();

    const syncResult = await processWorkoutSync(user, workout);
    await saveWithRetry(user);
    const progressMap = await getProgressMap();
    res.json(formatWorkoutSyncResponse(user, workout, syncResult, today, progressMap));
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

    const { validateLogValue } = require('../utils/validateInput');
    let parsed;
    try {
      parsed = validateLogValue(task.lifetimeMetric, req.body?.value);
    } catch (e) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }

    const oldValue = task.logValue ?? task.defaultLogValue ?? 1;
    task.logValue = parsed;
    const badgesUnlocked = await adjustTaskLifetimeLogValue(user, task, parsed, oldValue);
    await task.save();
    await saveWithRetry(user);

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

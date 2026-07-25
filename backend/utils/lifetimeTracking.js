const { isSameDay, startOfDay } = require('./dateHelpers');
const {
  applyLifetimeDelta,
  checkAndUnlockBadges,
  ensureLifetimeStats,
  stepsToKm,
} = require('./lifetimeStats');
const { getWorkoutGrindSnapshots } = require('./grindSync');
const {
  setWorkoutCompletedForDate,
  setStudyHoursForDate,
  setStepsForDate,
  setWaterForDate,
  setProteinForDate,
  setSleepForDate,
} = require('./dailyMetricLog');
const {
  calculateExpReward,
  applyExpAndLevelUp,
  revertExpAndLevelDown,
  incrementStat,
  decrementStat,
} = require('./gameLogic');
const { appendStatHistory } = require('./statHistory');
const {
  isRecoveryDayType,
  estimateExerciseVolumeKg,
} = require('./workoutRoutines');

const WORKOUT_DAILY_TASK_NAME = 'Complete workout of the day';

const DEFAULT_WORKOUT_STAT_REWARDS = [
  { stat: 'strength', amount: 2 },
  { stat: 'agility', amount: 1 }, // Endurance
];

const applyStatRewards = (user, rewards) => {
  for (const r of rewards || []) {
    incrementStat(user, r.stat, r.amount || 1);
  }
};

const revertStatRewards = (user, rewards) => {
  for (const r of rewards || []) {
    decrementStat(user, r.stat, r.amount || 1);
  }
};

const resolveTaskStatRewards = (task) => {
  if (task.statRewards?.length) return task.statRewards;
  return [{ stat: task.statModifier, amount: 1 }];
};

const isExerciseCompleteToday = (ex, dayDate) =>
  ex.completed && isSameDay(ex.lastCompletedDate, dayDate);

const isWorkoutFullyComplete = (workout, dayDate) => {
  if (!workout || workout.exercises.length === 0) return false;
  return workout.exercises.every((ex) => {
    if (ex.trackingType === 'steps') {
      const stepsToday = isSameDay(ex.lastStepsDate, dayDate) ? ex.currentSteps || 0 : 0;
      const target = ex.stepTarget || 10000;
      return stepsToday >= target && isExerciseCompleteToday(ex, dayDate);
    }
    return isExerciseCompleteToday(ex, dayDate);
  });
};

const bumpWorkoutStreak = (user, today) => {
  ensureLifetimeStats(user);
  const last = user.lastWorkoutStreakDate ? startOfDay(user.lastWorkoutStreakDate) : null;
  const todayStart = startOfDay(today);
  if (last && last.getTime() === todayStart.getTime()) return;

  const yesterday = new Date(todayStart);
  yesterday.setDate(yesterday.getDate() - 1);

  if (last && last.getTime() === yesterday.getTime()) {
    user.workoutStreak = (user.workoutStreak || 0) + 1;
  } else {
    user.workoutStreak = 1;
  }
  user.bestWorkoutStreak = Math.max(user.bestWorkoutStreak || 0, user.workoutStreak);
  user.lastWorkoutStreakDate = today;
};

const reverseWorkoutStreakIfToday = (user, today) => {
  if (user.lastWorkoutStreakDate && isSameDay(user.lastWorkoutStreakDate, today)) {
    user.workoutStreak = Math.max(0, (user.workoutStreak || 1) - 1);
    user.lastWorkoutStreakDate = null;
  }
};

const syncWorkoutLifetimeCount = async (user, workout) => {
  const today = new Date();
  const fullyComplete = isWorkoutFullyComplete(workout, today);
  const countedToday =
    user.lastWorkoutCountedDate && isSameDay(user.lastWorkoutCountedDate, today);
  const recovery = isRecoveryDayType(workout.dayType);

  let grindUpdates = [];

  if (fullyComplete && !countedToday) {
    if (recovery) {
      applyLifetimeDelta(user, 'active_recovery', 1);
      user.lastRecoveryCountedDate = today;
      // Steps/distance already applied when step goal hit
    } else {
      applyLifetimeDelta(user, 'workouts_completed', 1);
      const volume = workout.exercises.reduce(
        (sum, ex) => sum + estimateExerciseVolumeKg(ex),
        0
      );
      if (volume > 0) applyLifetimeDelta(user, 'weight_lifted', volume);
    }
    bumpWorkoutStreak(user, today);
    user.lastWorkoutCountedDate = today;
    await setWorkoutCompletedForDate(today, true, { isRecovery: recovery });
    grindUpdates = await getWorkoutGrindSnapshots();
    const badges = checkAndUnlockBadges(user);
    return { badgesUnlocked: badges, grindUpdates };
  }

  if (!fullyComplete && countedToday) {
    if (recovery) {
      applyLifetimeDelta(user, 'active_recovery', -1);
      user.lastRecoveryCountedDate = null;
    } else {
      applyLifetimeDelta(user, 'workouts_completed', -1);
      const volume = workout.exercises.reduce(
        (sum, ex) => sum + estimateExerciseVolumeKg(ex),
        0
      );
      if (volume > 0) applyLifetimeDelta(user, 'weight_lifted', -volume);
    }
    reverseWorkoutStreakIfToday(user, today);
    user.lastWorkoutCountedDate = null;
    await setWorkoutCompletedForDate(today, false, { isRecovery: recovery });
    grindUpdates = await getWorkoutGrindSnapshots();
    return { badgesUnlocked: [], grindUpdates };
  }

  if (fullyComplete && countedToday) {
    await setWorkoutCompletedForDate(today, true, { isRecovery: recovery });
  }

  return { badgesUnlocked: [], grindUpdates };
};

const syncWorkoutDailyTask = async (user, today, fullyComplete) => {
  const DailyTask = require('../models/DailyTask');
  const task = await DailyTask.findOne({ taskName: WORKOUT_DAILY_TASK_NAME });
  if (!task) return null;

  const taskCompleteToday =
    task.isCompleted && isSameDay(task.lastCompletedDate, today);
  const rewards = task.statRewards?.length
    ? task.statRewards
    : DEFAULT_WORKOUT_STAT_REWARDS;

  if (fullyComplete && !taskCompleteToday) {
    const expGained = calculateExpReward(task.expReward, task.statModifier);
    task.isCompleted = true;
    task.lastCompletedDate = today;
    await task.save();
    applyStatRewards(user, rewards);
    const levelUps = applyExpAndLevelUp(user, expGained);
    appendStatHistory(user, today);
    return {
      action: 'completed',
      expGained,
      statRewards: rewards,
      levelUps,
      taskId: task._id.toString(),
    };
  }

  if (!fullyComplete && taskCompleteToday) {
    const expLost = calculateExpReward(task.expReward, task.statModifier);
    task.isCompleted = false;
    task.lastCompletedDate = null;
    await task.save();
    revertStatRewards(user, rewards);
    const levelDowns = revertExpAndLevelDown(user, expLost);
    appendStatHistory(user, today);
    return {
      action: 'reverted',
      expLost,
      statRewards: rewards,
      levelDowns,
      taskId: task._id.toString(),
    };
  }

  return null;
};

const processWorkoutSync = async (user, workout) => {
  const today = new Date();
  const fullyComplete = isWorkoutFullyComplete(workout, today);
  const lifetime = await syncWorkoutLifetimeCount(user, workout);
  const taskReward = await syncWorkoutDailyTask(user, today, fullyComplete);
  return {
    ...lifetime,
    taskReward,
    workoutFullyComplete: fullyComplete,
  };
};

/**
 * Add steps to a steps-tracked exercise. Auto-completes when target reached.
 * Returns { newlyCompletedGoal, stepsAdded, currentSteps, stepTarget }
 */
const applyStepDelta = async (user, exercise, delta, today = new Date()) => {
  if (exercise.trackingType !== 'steps') {
    const err = new Error('Exercise does not track steps');
    err.statusCode = 400;
    throw err;
  }

  if (!isSameDay(exercise.lastStepsDate, today)) {
    exercise.currentSteps = 0;
    exercise.lastStepsDate = today;
  }

  const target = exercise.stepTarget || 10000;
  const prev = exercise.currentSteps || 0;
  const next = Math.max(0, Math.min(target * 2, prev + delta)); // allow slight overshoot display cap at 2x
  const capped = Math.min(target, next);
  const added = capped - Math.min(prev, target);
  exercise.currentSteps = capped;
  exercise.lastStepsDate = today;

  if (added !== 0) {
    applyLifetimeDelta(user, 'total_steps', added);
    applyLifetimeDelta(user, 'distance_km', stepsToKm(added));
  }

  await setStepsForDate(today, capped);

  let newlyCompletedGoal = false;
  if (capped >= target) {
    if (!isExerciseCompleteToday(exercise, today)) {
      newlyCompletedGoal = true;
    }
    exercise.completed = true;
    exercise.lastCompletedDate = today;
  } else {
    exercise.completed = false;
    exercise.lastCompletedDate = null;
  }

  checkAndUnlockBadges(user);
  return {
    newlyCompletedGoal,
    stepsAdded: added,
    currentSteps: exercise.currentSteps,
    stepTarget: target,
  };
};

const applyTaskLifetimeOnComplete = async (user, task) => {
  if (!task.lifetimeMetric || task.lifetimeMetric === 'none') {
    // Still write mission metrics for non-lifetime quests
    await writeDailyMissionMetrics(task, true);
    return [];
  }
  const amount = Math.max(0, task.logValue ?? task.defaultLogValue ?? 1);
  task.lastCountedValue = amount;
  applyLifetimeDelta(user, task.lifetimeMetric, amount);
  if (task.lifetimeMetric === 'study_hours') {
    await setStudyHoursForDate(new Date(), amount);
  }
  if (task.lifetimeMetric === 'water_liters') {
    await setWaterForDate(new Date(), amount);
  }
  await writeDailyMissionMetrics(task, true);
  return checkAndUnlockBadges(user);
};

const revertTaskLifetimeOnUncomplete = async (user, task) => {
  if (task.lifetimeMetric && task.lifetimeMetric !== 'none') {
    const amount = task.lastCountedValue || task.logValue || task.defaultLogValue || 0;
    if (amount > 0) {
      applyLifetimeDelta(user, task.lifetimeMetric, -amount);
    }
    task.lastCountedValue = 0;
    if (task.lifetimeMetric === 'study_hours') {
      await setStudyHoursForDate(new Date(), 0);
    }
    if (task.lifetimeMetric === 'water_liters') {
      await setWaterForDate(new Date(), 0);
    }
  }
  await writeDailyMissionMetrics(task, false);
};

/** Map daily quest clears onto DailyMetricLog for Hunter Missions. */
const writeDailyMissionMetrics = async (task, completed) => {
  const name = (task.taskName || '').toLowerCase();
  const today = new Date();
  if (name.includes('protein')) {
    await setProteinForDate(today, completed ? 3 : 0);
  }
  if (name.includes('sleep')) {
    await setSleepForDate(today, completed);
  }
  if (name.includes('water') && (!task.lifetimeMetric || task.lifetimeMetric === 'none')) {
    const amount = task.logValue ?? task.defaultLogValue ?? 3;
    await setWaterForDate(today, completed ? amount : 0);
  }
};

const adjustTaskLifetimeLogValue = async (user, task, newValue, oldValue) => {
  if (!task.lifetimeMetric || task.lifetimeMetric === 'none') return [];
  if (!task.isCompleted) return [];

  const today = new Date();
  if (!isSameDay(task.lastCompletedDate, today)) return [];

  const delta = newValue - oldValue;
  if (delta === 0) return [];

  task.lastCountedValue = (task.lastCountedValue || oldValue) + delta;
  applyLifetimeDelta(user, task.lifetimeMetric, delta);
  if (task.lifetimeMetric === 'study_hours') {
    await setStudyHoursForDate(today, newValue);
  }
  if (task.lifetimeMetric === 'water_liters') {
    await setWaterForDate(today, newValue);
  }
  return checkAndUnlockBadges(user);
};

const resetTaskLogValues = async () => {
  const DailyTask = require('../models/DailyTask');
  const tasks = await DailyTask.find({
    lifetimeMetric: { $ne: 'none' },
  });
  for (const task of tasks) {
    task.logValue = task.defaultLogValue ?? 1;
    task.lastCountedValue = 0;
    await task.save();
  }
};

const resetWorkoutStepProgress = async () => {
  const Workout = require('../models/Workout');
  const workouts = await Workout.find();
  for (const workout of workouts) {
    let dirty = false;
    for (const ex of workout.exercises) {
      if (ex.trackingType === 'steps') {
        ex.currentSteps = 0;
        ex.lastStepsDate = null;
        dirty = true;
      }
    }
    if (dirty) await workout.save();
  }
};

module.exports = {
  WORKOUT_DAILY_TASK_NAME,
  DEFAULT_WORKOUT_STAT_REWARDS,
  isWorkoutFullyComplete,
  syncWorkoutLifetimeCount,
  processWorkoutSync,
  applyTaskLifetimeOnComplete,
  revertTaskLifetimeOnUncomplete,
  adjustTaskLifetimeLogValue,
  resetTaskLogValues,
  resetWorkoutStepProgress,
  applyStepDelta,
  applyStatRewards,
  revertStatRewards,
  resolveTaskStatRewards,
};

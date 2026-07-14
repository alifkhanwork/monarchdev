const { isSameDay } = require('./dateHelpers');
const {
  applyLifetimeDelta,
  checkAndUnlockBadges,
} = require('./lifetimeStats');
const { getWorkoutGrindSnapshots } = require('./grindSync');
const {
  setWorkoutCompletedForDate,
  setStudyHoursForDate,
} = require('./dailyMetricLog');
const {
  calculateExpReward,
  applyExpAndLevelUp,
  revertExpAndLevelDown,
  incrementStat,
  decrementStat,
} = require('./gameLogic');
const { appendStatHistory } = require('./statHistory');

const WORKOUT_DAILY_TASK_NAME = 'Complete workout of the day';

const isWorkoutFullyComplete = (workout, dayDate) => {
  if (!workout || workout.exercises.length === 0) return false;
  return workout.exercises.every(
    (ex) => ex.completed && isSameDay(ex.lastCompletedDate, dayDate)
  );
};

const syncWorkoutLifetimeCount = async (user, workout) => {
  const today = new Date();
  const fullyComplete = isWorkoutFullyComplete(workout, today);
  const countedToday =
    user.lastWorkoutCountedDate && isSameDay(user.lastWorkoutCountedDate, today);

  let grindUpdates = [];

  if (fullyComplete && !countedToday) {
    applyLifetimeDelta(user, 'workouts_completed', 1);
    user.lastWorkoutCountedDate = today;
    await setWorkoutCompletedForDate(today, true);
    grindUpdates = await getWorkoutGrindSnapshots();
    const badges = checkAndUnlockBadges(user);
    return { badgesUnlocked: badges, grindUpdates };
  }

  if (!fullyComplete && countedToday) {
    applyLifetimeDelta(user, 'workouts_completed', -1);
    user.lastWorkoutCountedDate = null;
    await setWorkoutCompletedForDate(today, false);
    grindUpdates = await getWorkoutGrindSnapshots();
    return { badgesUnlocked: [], grindUpdates };
  }

  // Already counted today and still complete — keep log true (idempotent, no double count)
  if (fullyComplete && countedToday) {
    await setWorkoutCompletedForDate(today, true);
  }

  return { badgesUnlocked: [], grindUpdates };
};

const syncWorkoutDailyTask = async (user, today, fullyComplete) => {
  const DailyTask = require('../models/DailyTask');
  const task = await DailyTask.findOne({ taskName: WORKOUT_DAILY_TASK_NAME });
  if (!task) return null;

  const taskCompleteToday =
    task.isCompleted && isSameDay(task.lastCompletedDate, today);

  if (fullyComplete && !taskCompleteToday) {
    const expGained = calculateExpReward(task.expReward, task.statModifier);
    task.isCompleted = true;
    task.lastCompletedDate = today;
    await task.save();
    incrementStat(user, task.statModifier, 1);
    const levelUps = applyExpAndLevelUp(user, expGained);
    appendStatHistory(user, today);
    return {
      action: 'completed',
      expGained,
      statModifier: task.statModifier,
      statAmount: 1,
      levelUps,
      taskId: task._id.toString(),
    };
  }

  if (!fullyComplete && taskCompleteToday) {
    const expLost = calculateExpReward(task.expReward, task.statModifier);
    task.isCompleted = false;
    task.lastCompletedDate = null;
    await task.save();
    decrementStat(user, task.statModifier, 1);
    const levelDowns = revertExpAndLevelDown(user, expLost);
    appendStatHistory(user, today);
    return {
      action: 'reverted',
      expLost,
      statModifier: task.statModifier,
      statAmount: 1,
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

const applyTaskLifetimeOnComplete = async (user, task) => {
  if (!task.lifetimeMetric || task.lifetimeMetric === 'none') return [];
  const amount = Math.max(0, task.logValue ?? task.defaultLogValue ?? 1);
  task.lastCountedValue = amount;
  applyLifetimeDelta(user, task.lifetimeMetric, amount);
  if (task.lifetimeMetric === 'study_hours') {
    await setStudyHoursForDate(new Date(), amount);
  }
  return checkAndUnlockBadges(user);
};

const revertTaskLifetimeOnUncomplete = async (user, task) => {
  if (!task.lifetimeMetric || task.lifetimeMetric === 'none') return;
  const amount = task.lastCountedValue || task.logValue || task.defaultLogValue || 0;
  if (amount > 0) {
    applyLifetimeDelta(user, task.lifetimeMetric, -amount);
  }
  task.lastCountedValue = 0;
  if (task.lifetimeMetric === 'study_hours') {
    await setStudyHoursForDate(new Date(), 0);
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

module.exports = {
  WORKOUT_DAILY_TASK_NAME,
  isWorkoutFullyComplete,
  syncWorkoutLifetimeCount,
  processWorkoutSync,
  applyTaskLifetimeOnComplete,
  revertTaskLifetimeOnUncomplete,
  adjustTaskLifetimeLogValue,
  resetTaskLogValues,
};

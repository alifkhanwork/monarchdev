const DailyTask = require('../models/DailyTask');
const Workout = require('../models/Workout');
const { getWorkoutDayType, isSameDay, startOfDay } = require('./dateHelpers');
const { revertExpAndLevelDown } = require('./gameLogic');
const { appendStatHistory } = require('./statHistory');
const {
  getTodayKey,
  getStatusForDate,
  isFrozenStatus,
  logFreezeDay,
  ensureTodayStatus,
} = require('./dayStatus');
const { resetTaskLogValues, resetWorkoutStepProgress } = require('./lifetimeTracking');

const evaluateDayComplete = async (dayDate) => {
  const tasks = await DailyTask.find();
  const allTasksDone = tasks.every(
    (t) => t.isCompleted && isSameDay(t.lastCompletedDate, dayDate)
  );
  if (!allTasksDone) {
    return {
      complete: false,
      incompleteCount: tasks.filter(
        (t) => !(t.isCompleted && isSameDay(t.lastCompletedDate, dayDate))
      ).length,
    };
  }

  const dayType = getWorkoutDayType(dayDate);
  const workout = await Workout.findOne({ dayType });
  if (!workout || workout.exercises.length === 0) {
    return { complete: allTasksDone, incompleteCount: 0 };
  }

  const incompleteExercises = workout.exercises.filter(
    (ex) => !(ex.completed && isSameDay(ex.lastCompletedDate, dayDate))
  );

  return {
    complete: incompleteExercises.length === 0,
    incompleteCount: incompleteExercises.length,
  };
};

const resetDailyProgress = async () => {
  await DailyTask.updateMany({}, { isCompleted: false, lastCompletedDate: null });
  const workouts = await Workout.find();
  for (const workout of workouts) {
    workout.exercises.forEach((ex) => {
      ex.completed = false;
      ex.lastCompletedDate = null;
    });
    await workout.save();
  }
};

const processDayRollover = async (user) => {
  const today = startOfDay();
  const lastProcessed = user.lastProcessedDate ? startOfDay(user.lastProcessedDate) : null;
  let penaltyApplied = null;

  if (!lastProcessed || lastProcessed.getTime() < today.getTime()) {
    if (lastProcessed) {
      const dayKey = getTodayKey(lastProcessed);
      const dayStatus = getStatusForDate(user, dayKey);

      if (isFrozenStatus(dayStatus)) {
        logFreezeDay(user, dayKey, dayStatus);
        user.dayCompletionLog = user.dayCompletionLog || [];
        user.dayCompletionLog.push({ date: dayKey, status: 'frozen' });
      } else {
        const { complete, incompleteCount } = await evaluateDayComplete(lastProcessed);

        user.dayCompletionLog = user.dayCompletionLog || [];
        user.dayCompletionLog.push({
          date: dayKey,
          status: complete ? 'complete' : 'incomplete',
        });
        if (user.dayCompletionLog.length > 90) {
          user.dayCompletionLog = user.dayCompletionLog.slice(-90);
        }

        if (complete) {
          user.currentStreak = (user.currentStreak || 0) + 1;
          user.bestStreak = Math.max(user.bestStreak || 0, user.currentStreak);
          user.lastDayCompleteDate = lastProcessed;
        } else {
          user.currentStreak = 0;
          const expLost = Math.min(incompleteCount * 5, 50);
          if (expLost > 0) {
            revertExpAndLevelDown(user, expLost);
          }
          user.pendingPenalty = {
            date: lastProcessed,
            incompleteCount,
            expLost,
            dismissed: false,
          };
          penaltyApplied = user.pendingPenalty;
        }
      }

      appendStatHistory(user, lastProcessed);
    }

    await resetDailyProgress();
    await resetTaskLogValues();
    await resetWorkoutStepProgress();
    user.lastWorkoutCountedDate = null;
    user.lastProcessedDate = today;
    user.todayDayStatus = { date: getTodayKey(today), status: 'normal' };
    appendStatHistory(user, today);
    await user.save();
  } else {
    ensureTodayStatus(user);
  }

  return penaltyApplied;
};

const getTodayCompletionStatus = async () => {
  const today = new Date();
  return evaluateDayComplete(today);
};

const assertDayNotFrozen = (user) => {
  const status = ensureTodayStatus(user);
  if (isFrozenStatus(status)) {
    const err = new Error('Dailies are paused for today (Streak Freeze active)');
    err.statusCode = 403;
    throw err;
  }
};

module.exports = {
  evaluateDayComplete,
  resetDailyProgress,
  processDayRollover,
  getTodayCompletionStatus,
  assertDayNotFrozen,
};

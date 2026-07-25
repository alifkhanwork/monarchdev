const DailyMetricLog = require('../models/DailyMetricLog');
const WorkoutSession = require('../models/WorkoutSession');
const {
  localDateKey,
  getWeekDateKeys,
  getMonthDateKeys,
} = require('./dateHelpers');

const roundHours = (n) => Math.round(Math.max(0, Number(n) || 0) * 100) / 100;
const roundLiters = (n) => Math.round(Math.max(0, Number(n) || 0) * 100) / 100;

const upsertDay = async (dateKey, setFields) => {
  return DailyMetricLog.findOneAndUpdate(
    { dateKey },
    { $set: setFields },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const setWorkoutCompletedForDate = async (date = new Date(), completed, options = {}) => {
  const dateKey = localDateKey(date);
  const setFields = {
    workoutCompleted: Boolean(completed),
  };
  if (options.isRecovery != null) setFields.isRecovery = Boolean(options.isRecovery);
  if (!completed) {
    setFields.isRecovery = false;
    setFields.cardioCompleted = false;
  } else {
    // Lifting or recovery clear both count as a cardio session day
    setFields.cardioCompleted = true;
  }
  return upsertDay(dateKey, setFields);
};

const setStudyHoursForDate = async (date = new Date(), hours) => {
  const dateKey = localDateKey(date);
  return upsertDay(dateKey, { studyHours: roundHours(hours) });
};

const setStepsForDate = async (date = new Date(), steps) => {
  const dateKey = localDateKey(date);
  return upsertDay(dateKey, { steps: Math.max(0, Math.round(Number(steps) || 0)) });
};

const setWaterForDate = async (date = new Date(), liters) => {
  const dateKey = localDateKey(date);
  return upsertDay(dateKey, { waterLiters: roundLiters(liters) });
};

const setProteinForDate = async (date = new Date(), meals) => {
  const dateKey = localDateKey(date);
  return upsertDay(dateKey, { proteinMeals: Math.max(0, Math.round(Number(meals) || 0)) });
};

const setSleepForDate = async (date = new Date(), done) => {
  const dateKey = localDateKey(date);
  return upsertDay(dateKey, { sleepDone: Boolean(done) });
};

const findLogsInRange = async (startKey, endKey) => {
  return DailyMetricLog.find({
    dateKey: { $gte: startKey, $lte: endKey },
  }).lean();
};

const countWorkoutsInRange = async (startKey, endKey) => {
  const logs = await findLogsInRange(startKey, endKey);
  return logs.filter((l) => l.workoutCompleted && !l.isRecovery).length;
};

const countRecoveryInRange = async (startKey, endKey) => {
  const logs = await findLogsInRange(startKey, endKey);
  return logs.filter((l) => l.workoutCompleted && l.isRecovery).length;
};

const countCardioInRange = async (startKey, endKey) => {
  const logs = await findLogsInRange(startKey, endKey);
  return logs.filter((l) => l.cardioCompleted || (l.workoutCompleted && l.isRecovery)).length;
};

const sumStudyHoursInRange = async (startKey, endKey) => {
  const logs = await findLogsInRange(startKey, endKey);
  return roundHours(logs.reduce((sum, l) => sum + (l.studyHours || 0), 0));
};

const sumStepsInRange = async (startKey, endKey) => {
  const logs = await findLogsInRange(startKey, endKey);
  return logs.reduce((sum, l) => sum + (l.steps || 0), 0);
};

const sumWaterInRange = async (startKey, endKey) => {
  const logs = await findLogsInRange(startKey, endKey);
  return roundLiters(logs.reduce((sum, l) => sum + (l.waterLiters || 0), 0));
};

const sumProteinInRange = async (startKey, endKey) => {
  const logs = await findLogsInRange(startKey, endKey);
  return logs.reduce((sum, l) => sum + (l.proteinMeals || 0), 0);
};

const countSleepInRange = async (startKey, endKey) => {
  const logs = await findLogsInRange(startKey, endKey);
  return logs.filter((l) => l.sleepDone).length;
};

const countOverloadProgressionsInRange = async (startKey, endKey) => {
  const sessions = await WorkoutSession.find({
    dateKey: { $gte: startKey, $lte: endKey },
  }).lean();
  const progressed = new Set();
  for (const s of sessions) {
    for (const ex of s.exercises || []) {
      if (ex.verdict === 'progress') progressed.add(ex.exerciseName);
    }
  }
  return progressed.size;
};

const deriveForPeriod = async (period) => {
  const range = period === 'weekly' ? getWeekDateKeys() : getMonthDateKeys();
  const [
    workouts,
    studyHours,
    recoveryDays,
    steps,
    cardio,
    water,
    protein,
    sleepNights,
    overloadProgressions,
  ] = await Promise.all([
    countWorkoutsInRange(range.startKey, range.endKey),
    sumStudyHoursInRange(range.startKey, range.endKey),
    countRecoveryInRange(range.startKey, range.endKey),
    sumStepsInRange(range.startKey, range.endKey),
    countCardioInRange(range.startKey, range.endKey),
    sumWaterInRange(range.startKey, range.endKey),
    sumProteinInRange(range.startKey, range.endKey),
    countSleepInRange(range.startKey, range.endKey),
    countOverloadProgressionsInRange(range.startKey, range.endKey),
  ]);
  return {
    workouts,
    studyHours,
    recoveryDays,
    steps,
    cardio,
    water,
    protein,
    sleepNights,
    overloadProgressions,
    ...range,
  };
};

module.exports = {
  setWorkoutCompletedForDate,
  setStudyHoursForDate,
  setStepsForDate,
  setWaterForDate,
  setProteinForDate,
  setSleepForDate,
  countWorkoutsInRange,
  sumStudyHoursInRange,
  deriveForPeriod,
  roundHours,
  countRecoveryInRange,
};

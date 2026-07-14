const DailyMetricLog = require('../models/DailyMetricLog');
const {
  localDateKey,
  getWeekDateKeys,
  getMonthDateKeys,
} = require('./dateHelpers');

const roundHours = (n) => Math.round(Math.max(0, Number(n) || 0) * 100) / 100;

const upsertDay = async (dateKey, setFields) => {
  return DailyMetricLog.findOneAndUpdate(
    { dateKey },
    { $set: setFields },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

/** Idempotent: true stays true on repeat completes the same day. */
const setWorkoutCompletedForDate = async (date = new Date(), completed) => {
  const dateKey = localDateKey(date);
  return upsertDay(dateKey, { workoutCompleted: Boolean(completed) });
};

const setStudyHoursForDate = async (date = new Date(), hours) => {
  const dateKey = localDateKey(date);
  return upsertDay(dateKey, { studyHours: roundHours(hours) });
};

const findLogsInRange = async (startKey, endKey) => {
  return DailyMetricLog.find({
    dateKey: { $gte: startKey, $lte: endKey },
  }).lean();
};

const countWorkoutsInRange = async (startKey, endKey) => {
  const logs = await findLogsInRange(startKey, endKey);
  return logs.filter((l) => l.workoutCompleted).length;
};

const sumStudyHoursInRange = async (startKey, endKey) => {
  const logs = await findLogsInRange(startKey, endKey);
  return roundHours(logs.reduce((sum, l) => sum + (l.studyHours || 0), 0));
};

const deriveForPeriod = async (period) => {
  const range = period === 'weekly' ? getWeekDateKeys() : getMonthDateKeys();
  const [workouts, studyHours] = await Promise.all([
    countWorkoutsInRange(range.startKey, range.endKey),
    sumStudyHoursInRange(range.startKey, range.endKey),
  ]);
  return { workouts, studyHours, ...range };
};

module.exports = {
  setWorkoutCompletedForDate,
  setStudyHoursForDate,
  countWorkoutsInRange,
  sumStudyHoursInRange,
  deriveForPeriod,
  roundHours,
};

const WeeklyGrind = require('../models/WeeklyGrind');
const MonthlyGrind = require('../models/MonthlyGrind');
const DailyTask = require('../models/DailyTask');
const { getWeekKey, getMonthKey, isSameDay } = require('./dateHelpers');
const {
  deriveForPeriod,
  setWorkoutCompletedForDate,
  setStudyHoursForDate,
} = require('./dailyMetricLog');
const { getPlayer } = require('./getPlayer');

const TRACKING = {
  MANUAL: 'manual',
  WORKOUT: 'workout',
  STUDY_HOURS: 'study_hours',
};

const isAutoTracked = (quest) =>
  quest.trackingSource === TRACKING.WORKOUT ||
  quest.trackingSource === TRACKING.STUDY_HOURS;

const ensureWeeklyPeriod = (quest) => {
  const currentKey = getWeekKey();
  if (quest.periodKey !== currentKey) {
    if (!isAutoTracked(quest)) {
      quest.currentProgress = 0;
    }
    quest.periodKey = currentKey;
  }
};

const ensureMonthlyPeriod = (quest) => {
  const currentKey = getMonthKey();
  if (quest.periodKey !== currentKey) {
    if (!isAutoTracked(quest)) {
      quest.currentProgress = 0;
    }
    quest.periodKey = currentKey;
  }
};

const resolveProgress = (quest, derived) => {
  if (quest.trackingSource === TRACKING.WORKOUT) {
    return derived.workouts;
  }
  if (quest.trackingSource === TRACKING.STUDY_HOURS) {
    return derived.studyHours;
  }
  return quest.currentProgress;
};

const formatQuest = (quest, derived) => {
  const raw = resolveProgress(quest, derived);
  const currentProgress = Math.max(
    0,
    Math.min(quest.targetCount, Number(raw) || 0)
  );
  return {
    _id: quest._id,
    title: quest.title,
    category: quest.category,
    targetCount: quest.targetCount,
    currentProgress,
    progressPercent: Math.min(
      100,
      Math.round((currentProgress / quest.targetCount) * 100)
    ),
    trackingSource: quest.trackingSource || TRACKING.MANUAL,
    autoTracked: isAutoTracked(quest),
  };
};

/** Keep today's DailyMetricLog aligned with live task/workout state (mid-day deploy / retries). */
const reconcileTodayMetrics = async () => {
  const today = new Date();
  try {
    const user = await getPlayer();
    if (user.lastWorkoutCountedDate && isSameDay(user.lastWorkoutCountedDate, today)) {
      await setWorkoutCompletedForDate(today, true);
    }
    const studyTask = await DailyTask.findOne({ lifetimeMetric: 'study_hours' });
    if (
      studyTask &&
      studyTask.isCompleted &&
      isSameDay(studyTask.lastCompletedDate, today)
    ) {
      const hours =
        studyTask.lastCountedValue ||
        studyTask.logValue ||
        studyTask.defaultLogValue ||
        0;
      await setStudyHoursForDate(today, hours);
    }
  } catch {
    // Player may be unavailable during seed; skip reconcilation.
  }
};

const hydrateWeeklyQuests = async (quests) => {
  await reconcileTodayMetrics();
  const derived = await deriveForPeriod('weekly');
  return quests.map((q) => formatQuest(q, derived));
};

const hydrateMonthlyQuests = async (quests) => {
  await reconcileTodayMetrics();
  const derived = await deriveForPeriod('monthly');
  return quests.map((q) => formatQuest(q, derived));
};

/** Snapshot of auto-tracked workout grind cards after a daily WOD sync. */
const getWorkoutGrindSnapshots = async () => {
  const [weeklyQuests, monthlyQuests] = await Promise.all([
    WeeklyGrind.find({ trackingSource: TRACKING.WORKOUT }),
    MonthlyGrind.find({ trackingSource: TRACKING.WORKOUT }),
  ]);

  const weeklyDerived = await deriveForPeriod('weekly');
  const monthlyDerived = await deriveForPeriod('monthly');

  return [
    ...weeklyQuests.map((q) => ({
      scope: 'weekly',
      ...formatQuest(q, weeklyDerived),
    })),
    ...monthlyQuests.map((q) => ({
      scope: 'monthly',
      ...formatQuest(q, monthlyDerived),
    })),
  ];
};

module.exports = {
  TRACKING,
  isAutoTracked,
  ensureWeeklyPeriod,
  ensureMonthlyPeriod,
  hydrateWeeklyQuests,
  hydrateMonthlyQuests,
  getWorkoutGrindSnapshots,
};

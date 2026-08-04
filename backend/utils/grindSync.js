const WeeklyGrind = require('../models/WeeklyGrind');
const MonthlyGrind = require('../models/MonthlyGrind');
const DailyTask = require('../models/DailyTask');
const { getWeekKey, getMonthKey, isSameDay } = require('./dateHelpers');
const {
  deriveForPeriod,
  setWorkoutCompletedForDate,
  setStudyHoursForDate,
  setWaterForDate,
  setProteinForDate,
  setSleepForDate,
} = require('./dailyMetricLog');
const { getPlayer } = require('./getPlayer');
const { TRACKING, CATEGORIES } = require('./hunterMissions');
const { applyExpAndLevelUp, incrementStat } = require('./gameLogic');
const { appendStatHistory } = require('./statHistory');
const { saveWithRetry } = require('./saveWithRetry');

const AUTO_SOURCES = new Set([
  TRACKING.WORKOUT,
  TRACKING.STEPS,
  TRACKING.CARDIO,
  TRACKING.STUDY_HOURS,
  TRACKING.WATER,
  TRACKING.PROTEIN,
  TRACKING.SLEEP,
  TRACKING.OVERLOAD,
  TRACKING.ELITE_MONTHLY,
]);

const isAutoTracked = (quest) => AUTO_SOURCES.has(quest.trackingSource);

const ensureWeeklyPeriod = (quest) => {
  const currentKey = getWeekKey();
  if (quest.periodKey !== currentKey) {
    if (!isAutoTracked(quest)) quest.currentProgress = 0;
    quest.periodKey = currentKey;
    // Allow re-claim next period
  }
};

const ensureMonthlyPeriod = (quest) => {
  const currentKey = getMonthKey();
  if (quest.periodKey !== currentKey) {
    if (!isAutoTracked(quest)) quest.currentProgress = 0;
    quest.periodKey = currentKey;
  }
};

const resolveProgress = (quest, derived, eliteClearedCount = 0) => {
  switch (quest.trackingSource) {
    case TRACKING.WORKOUT:
      return derived.workouts;
    case TRACKING.STUDY_HOURS:
      return quest.unit === 'min' ? Math.round(derived.studyHours * 60) : derived.studyHours;
    case TRACKING.STEPS:
      return derived.steps;
    case TRACKING.CARDIO:
      return derived.cardio;
    case TRACKING.WATER:
      return derived.water;
    case TRACKING.PROTEIN:
      return derived.protein;
    case TRACKING.SLEEP:
      return derived.sleepNights;
    case TRACKING.OVERLOAD:
      return derived.overloadProgressions;
    case TRACKING.ELITE_MONTHLY:
      return eliteClearedCount;
    default:
      return quest.currentProgress;
  }
};

const formatQuest = (quest, derived, eliteClearedCount = 0) => {
  const raw = resolveProgress(quest, derived, eliteClearedCount);
  const currentProgress = Math.max(0, Math.min(quest.targetCount, Number(raw) || 0));
  const catMeta = CATEGORIES[quest.category] || { icon: '◆', color: 'fitness' };
  return {
    _id: quest._id,
    missionKey: quest.missionKey,
    title: quest.title,
    description: quest.description || '',
    category: quest.category,
    categoryIcon: catMeta.icon,
    categoryColor: catMeta.color,
    targetCount: quest.targetCount,
    currentProgress,
    progressPercent: Math.min(
      100,
      Math.round((currentProgress / quest.targetCount) * 100)
    ),
    trackingSource: quest.trackingSource || TRACKING.MANUAL,
    autoTracked: isAutoTracked(quest),
    expReward: quest.expReward || 0,
    unit: quest.unit || '',
    isElite: Boolean(quest.isElite),
    rewardClaimed: quest.rewardClaimedPeriodKey === quest.periodKey,
    sortOrder: quest.sortOrder ?? 100,
  };
};

const grantMissionReward = async (quest, user) => {
  if (!quest.expReward || quest.rewardClaimedPeriodKey === quest.periodKey) {
    return null;
  }
  if (quest.currentProgress < quest.targetCount && !isAutoTracked(quest)) {
    // for manual, progress is on doc; for auto we pass hydrated progress separately
  }

  const levelUps = applyExpAndLevelUp(user, quest.expReward);
  quest.rewardClaimedPeriodKey = quest.periodKey;

  let eliteGranted = null;
  if (quest.isElite && quest.eliteStatBoost) {
    const amount = quest.eliteStatBoost;
    for (const stat of ['strength', 'agility', 'intelligence', 'perception', 'vitality']) {
      incrementStat(user, stat, amount);
    }
    if (quest.eliteBadgeId) {
      user.unlockedBadges = user.unlockedBadges || [];
      if (!user.unlockedBadges.includes(quest.eliteBadgeId)) {
        user.unlockedBadges.push(quest.eliteBadgeId);
      }
    }
    eliteGranted = { statBoost: amount, badgeId: quest.eliteBadgeId };
  }

  await quest.save();
  appendStatHistory(user, new Date());
  return { expReward: quest.expReward, levelUps, eliteGranted };
};

/**
 * After hydrating progress, claim rewards for newly completed missions.
 */
const claimCompletedRewards = async (quests, derived, eliteClearedCount, user) => {
  const claims = [];
  for (const quest of quests) {
    const progress = resolveProgress(quest, derived, eliteClearedCount);
    const done = progress >= quest.targetCount;
    if (!done) continue;
    if (quest.rewardClaimedPeriodKey === quest.periodKey) continue;
    if (!quest.expReward) continue;

    // Temporarily stash for grant check
    quest.currentProgress = Math.min(quest.targetCount, progress);
    const claim = await grantMissionReward(quest, user);
    if (claim) claims.push({ missionKey: quest.missionKey, title: quest.title, ...claim });
  }
  return claims;
};

const reconcileTodayMetrics = async () => {
  const today = new Date();
  try {
    const user = await getPlayer();
    if (user.lastWorkoutCountedDate && isSameDay(user.lastWorkoutCountedDate, today)) {
      await setWorkoutCompletedForDate(today, true, {
        isRecovery: Boolean(user.lastRecoveryCountedDate && isSameDay(user.lastRecoveryCountedDate, today)),
      });
    }
    const tasks = await DailyTask.find({
      isCompleted: true,
    });
    for (const task of tasks) {
      if (!isSameDay(task.lastCompletedDate, today)) continue;
      const name = (task.taskName || '').toLowerCase();
      if (task.lifetimeMetric === 'study_hours') {
        const hours =
          task.lastCountedValue || task.logValue || task.defaultLogValue || 0;
        await setStudyHoursForDate(today, hours);
      }
      if (task.lifetimeMetric === 'water_liters' || name.includes('water')) {
        const liters = task.lastCountedValue || task.logValue || task.defaultLogValue || 0;
        await setWaterForDate(today, liters);
      }
      if (name.includes('protein')) await setProteinForDate(today, 3);
      if (name.includes('sleep')) await setSleepForDate(today, true);
    }
  } catch {
    // skip
  }
};

const hydrateWeeklyQuests = async (quests) => {
  await reconcileTodayMetrics();
  const derived = await deriveForPeriod('weekly');
  const user = await getPlayer();
  const claims = await claimCompletedRewards(quests, derived, 0, user);
  if (claims.length) await saveWithRetry(user);

  return {
    quests: quests
      .map((q) => formatQuest(q, derived))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    claims,
    derived,
  };
};

const hydrateMonthlyQuests = async (quests) => {
  await reconcileTodayMetrics();
  const derived = await deriveForPeriod('monthly');

  // Elite progress = how many non-elite monthly missions are cleared
  const nonElite = quests.filter((q) => !q.isElite);
  let eliteCleared = 0;
  for (const q of nonElite) {
    const p = resolveProgress(q, derived, 0);
    if (p >= q.targetCount) eliteCleared += 1;
  }

  // Update elite target to match non-elite count
  const elite = quests.find((q) => q.isElite);
  if (elite && elite.targetCount !== nonElite.length) {
    elite.targetCount = nonElite.length;
    await elite.save();
  }

  const user = await getPlayer();
  // Claim non-elite first, then elite
  const ordered = [...nonElite, ...quests.filter((q) => q.isElite)];
  const claims = await claimCompletedRewards(ordered, derived, eliteCleared, user);
  if (claims.length) await saveWithRetry(user);

  return {
    quests: quests
      .map((q) => formatQuest(q, derived, eliteCleared))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    claims,
    derived,
  };
};

const getWorkoutGrindSnapshots = async () => {
  const [weeklyQuests, monthlyQuests] = await Promise.all([
    WeeklyGrind.find({ trackingSource: TRACKING.WORKOUT }),
    MonthlyGrind.find({ trackingSource: TRACKING.WORKOUT }),
  ]);
  const weeklyDerived = await deriveForPeriod('weekly');
  const monthlyDerived = await deriveForPeriod('monthly');
  return [
    ...weeklyQuests.map((q) => ({ scope: 'weekly', ...formatQuest(q, weeklyDerived) })),
    ...monthlyQuests.map((q) => ({ scope: 'monthly', ...formatQuest(q, monthlyDerived) })),
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
  resolveProgress,
  formatQuest,
};

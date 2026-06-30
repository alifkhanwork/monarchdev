const WeeklyGrind = require('../models/WeeklyGrind');
const MonthlyGrind = require('../models/MonthlyGrind');
const { getWeekKey, getMonthKey } = require('./dateHelpers');

const WORKOUT_GRIND_FILTER = { category: 'Fitness', title: /workout/i };

const clampProgress = (quest, delta) => {
  quest.currentProgress = Math.max(
    0,
    Math.min(quest.targetCount, quest.currentProgress + delta)
  );
};

const ensureWeeklyPeriod = (quest) => {
  const currentKey = getWeekKey();
  if (quest.periodKey !== currentKey) {
    quest.currentProgress = 0;
    quest.periodKey = currentKey;
  }
};

const ensureMonthlyPeriod = (quest) => {
  const currentKey = getMonthKey();
  if (quest.periodKey !== currentKey) {
    quest.currentProgress = 0;
    quest.periodKey = currentKey;
  }
};

const syncWorkoutGrindProgress = async (delta) => {
  if (!delta) return [];

  const updated = [];

  const weeklyQuests = await WeeklyGrind.find(WORKOUT_GRIND_FILTER);
  for (const quest of weeklyQuests) {
    ensureWeeklyPeriod(quest);
    clampProgress(quest, delta);
    await quest.save();
    updated.push({
      scope: 'weekly',
      _id: quest._id,
      title: quest.title,
      currentProgress: quest.currentProgress,
      targetCount: quest.targetCount,
      progressPercent: Math.min(
        100,
        Math.round((quest.currentProgress / quest.targetCount) * 100)
      ),
    });
  }

  const monthlyQuests = await MonthlyGrind.find(WORKOUT_GRIND_FILTER);
  for (const quest of monthlyQuests) {
    ensureMonthlyPeriod(quest);
    clampProgress(quest, delta);
    await quest.save();
    updated.push({
      scope: 'monthly',
      _id: quest._id,
      title: quest.title,
      currentProgress: quest.currentProgress,
      targetCount: quest.targetCount,
      progressPercent: Math.min(
        100,
        Math.round((quest.currentProgress / quest.targetCount) * 100)
      ),
    });
  }

  return updated;
};

module.exports = {
  syncWorkoutGrindProgress,
};

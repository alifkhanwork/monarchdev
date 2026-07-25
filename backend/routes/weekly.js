const express = require('express');
const WeeklyGrind = require('../models/WeeklyGrind');
const { getWeekKey, getNextMonday } = require('../utils/dateHelpers');
const {
  TRACKING,
  isAutoTracked,
  ensureWeeklyPeriod,
  hydrateWeeklyQuests,
} = require('../utils/grindSync');
const { getPlayer } = require('../utils/getPlayer');
const { saveWithRetry } = require('../utils/saveWithRetry');
const { applyExpAndLevelUp } = require('../utils/gameLogic');
const { appendStatHistory } = require('../utils/statHistory');

const router = express.Router();

const ensurePeriod = async () => {
  const quests = await WeeklyGrind.find();
  for (const quest of quests) {
    const prevKey = quest.periodKey;
    const prevProgress = quest.currentProgress;
    ensureWeeklyPeriod(quest);
    if (quest.periodKey !== prevKey || quest.currentProgress !== prevProgress) {
      await quest.save();
    }
  }
};

const msUntilReset = () => {
  const next = getNextMonday();
  return Math.max(0, next.getTime() - Date.now());
};

router.get('/', async (req, res) => {
  try {
    await ensurePeriod();
    const quests = await WeeklyGrind.find().sort({ sortOrder: 1, createdAt: 1 });
    const { quests: hydrated, claims } = await hydrateWeeklyQuests(quests);

    res.json({
      periodKey: getWeekKey(),
      resetsInMs: msUntilReset(),
      quests: hydrated,
      rewardClaims: claims || [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch weekly grind', error: error.message });
  }
});

router.post('/:id/progress', async (req, res) => {
  try {
    const { validateGrindDelta } = require('../utils/validateInput');
    let delta;
    try {
      delta = validateGrindDelta(req.body?.delta ?? 1);
    } catch (e) {
      return res.status(e.statusCode || 400).json({ message: e.message });
    }
    await ensurePeriod();
    const quest = await WeeklyGrind.findById(req.params.id);
    if (!quest) return res.status(404).json({ message: 'Quest not found' });

    if (isAutoTracked(quest)) {
      return res.status(400).json({
        message: 'This quest is auto-tracked from Daily Grind',
      });
    }

    ensureWeeklyPeriod(quest);
    quest.currentProgress = Math.max(
      0,
      Math.min(quest.targetCount, quest.currentProgress + delta)
    );
    await quest.save();

    let rewardClaim = null;
    if (
      quest.currentProgress >= quest.targetCount &&
      quest.expReward &&
      quest.rewardClaimedPeriodKey !== quest.periodKey
    ) {
      const user = await getPlayer();
      const levelUps = applyExpAndLevelUp(user, quest.expReward);
      quest.rewardClaimedPeriodKey = quest.periodKey;
      await quest.save();
      appendStatHistory(user, new Date());
      await saveWithRetry(user);
      rewardClaim = { expReward: quest.expReward, levelUps, title: quest.title };
    }

    res.json({
      _id: quest._id,
      currentProgress: quest.currentProgress,
      progressPercent: Math.min(100, Math.round((quest.currentProgress / quest.targetCount) * 100)),
      trackingSource: quest.trackingSource || TRACKING.MANUAL,
      autoTracked: false,
      expReward: quest.expReward,
      rewardClaim,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update progress', error: error.message });
  }
});

module.exports = router;

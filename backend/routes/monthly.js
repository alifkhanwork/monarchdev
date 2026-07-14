const express = require('express');
const MonthlyGrind = require('../models/MonthlyGrind');
const { getMonthKey, getNextMonthStart } = require('../utils/dateHelpers');
const {
  TRACKING,
  isAutoTracked,
  ensureMonthlyPeriod,
  hydrateMonthlyQuests,
} = require('../utils/grindSync');

const router = express.Router();

const ensurePeriod = async () => {
  const quests = await MonthlyGrind.find();
  for (const quest of quests) {
    const prevKey = quest.periodKey;
    const prevProgress = quest.currentProgress;
    ensureMonthlyPeriod(quest);
    if (quest.periodKey !== prevKey || quest.currentProgress !== prevProgress) {
      await quest.save();
    }
  }
};

const msUntilReset = () => {
  const next = getNextMonthStart();
  return Math.max(0, next.getTime() - Date.now());
};

router.get('/', async (req, res) => {
  try {
    await ensurePeriod();
    const quests = await MonthlyGrind.find().sort({ createdAt: 1 });
    const hydrated = await hydrateMonthlyQuests(quests);

    res.json({
      periodKey: getMonthKey(),
      resetsInMs: msUntilReset(),
      quests: hydrated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch monthly grind', error: error.message });
  }
});

router.post('/:id/progress', async (req, res) => {
  try {
    const { delta = 1 } = req.body;
    await ensurePeriod();
    const quest = await MonthlyGrind.findById(req.params.id);
    if (!quest) return res.status(404).json({ message: 'Quest not found' });

    if (isAutoTracked(quest)) {
      return res.status(400).json({
        message: 'This quest is auto-tracked from Daily Grind',
      });
    }

    ensureMonthlyPeriod(quest);
    quest.currentProgress = Math.max(
      0,
      Math.min(quest.targetCount, quest.currentProgress + delta)
    );
    await quest.save();

    res.json({
      _id: quest._id,
      currentProgress: quest.currentProgress,
      progressPercent: Math.min(100, Math.round((quest.currentProgress / quest.targetCount) * 100)),
      trackingSource: quest.trackingSource || TRACKING.MANUAL,
      autoTracked: false,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update progress', error: error.message });
  }
});

module.exports = router;

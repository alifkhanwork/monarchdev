const express = require('express');
const WeeklyGrind = require('../models/WeeklyGrind');
const { getWeekKey, getNextMonday } = require('../utils/dateHelpers');

const router = express.Router();

const ensurePeriod = async () => {
  const currentKey = getWeekKey();
  const quests = await WeeklyGrind.find();
  for (const quest of quests) {
    if (quest.periodKey !== currentKey) {
      quest.currentProgress = 0;
      quest.periodKey = currentKey;
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
    const quests = await WeeklyGrind.find().sort({ createdAt: 1 });
    const resetsInMs = msUntilReset();

    res.json({
      periodKey: getWeekKey(),
      resetsInMs,
      quests: quests.map((q) => ({
        _id: q._id,
        title: q.title,
        category: q.category,
        targetCount: q.targetCount,
        currentProgress: q.currentProgress,
        progressPercent: Math.min(100, Math.round((q.currentProgress / q.targetCount) * 100)),
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch weekly grind', error: error.message });
  }
});

router.post('/:id/progress', async (req, res) => {
  try {
    const { delta = 1 } = req.body;
    await ensurePeriod();
    const quest = await WeeklyGrind.findById(req.params.id);
    if (!quest) return res.status(404).json({ message: 'Quest not found' });

    quest.currentProgress = Math.max(
      0,
      Math.min(quest.targetCount, quest.currentProgress + delta)
    );
    await quest.save();

    res.json({
      _id: quest._id,
      currentProgress: quest.currentProgress,
      progressPercent: Math.min(100, Math.round((quest.currentProgress / quest.targetCount) * 100)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update progress', error: error.message });
  }
});

module.exports = router;

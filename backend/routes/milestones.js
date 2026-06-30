const express = require('express');
const Milestone = require('../models/Milestone');

const router = express.Router();

const formatMilestone = (m) => {
  const subTasks = (m.subTasks || []).map((st) => ({
    _id: st._id,
    title: st.title,
    isCompleted: st.isCompleted,
  }));
  const completedSubs = subTasks.filter((st) => st.isCompleted).length;
  const progressPercent =
    subTasks.length > 0
      ? Math.round((completedSubs / subTasks.length) * 100)
      : m.isCompleted
        ? 100
        : 0;

  return {
    _id: m._id,
    title: m.title,
    category: m.category,
    isCompleted: m.isCompleted || progressPercent === 100,
    rewardType: m.rewardType,
    expReward: m.expReward,
    rewardStat: m.rewardStat || '',
    rewardStatAmount: m.rewardStatAmount || 0,
    targetDate: m.targetDate,
    ageGoal: m.ageGoal ?? null,
    subTasks,
    progressPercent,
    rewardItem: m.rewardItemId
      ? {
          _id: m.rewardItemId._id,
          name: m.rewardItemId.name,
          type: m.rewardItemId.type,
          rarity: m.rewardItemId.rarity,
          imageUrl: m.rewardItemId.imageUrl,
        }
      : null,
  };
};

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};

    const milestones = await Milestone.find(filter)
      .populate('rewardItemId')
      .sort({ category: 1, createdAt: 1 });

    res.json(milestones.map(formatMilestone));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch milestones', error: error.message });
  }
});

router.post('/:id/subtasks/:subtaskId/toggle', async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id).populate('rewardItemId');
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    const subtask = milestone.subTasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ message: 'Sub-task not found' });

    subtask.isCompleted = !subtask.isCompleted;
    const allDone = milestone.subTasks.every((st) => st.isCompleted);
    milestone.isCompleted = allDone;
    await milestone.save();

    res.json(formatMilestone(milestone));
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle sub-task', error: error.message });
  }
});

module.exports = router;

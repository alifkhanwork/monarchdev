const express = require('express');
const Milestone = require('../models/Milestone');
const MilestoneSeason = require('../models/MilestoneSeason');
const { inferQuestGroup } = require('../utils/questGroups');

const router = express.Router();

const isMilestoneCleared = (m) => {
  if (!m) return false;
  if (m.isCompleted) return true;
  const subs = m.subTasks || [];
  if (subs.length === 0) return Boolean(m.isCompleted);
  return subs.every((st) => st.isCompleted);
};

const formatMilestone = (m, lockMeta = {}) => {
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
    requiresMilestoneId: m.requiresMilestoneId
      ? String(m.requiresMilestoneId._id || m.requiresMilestoneId)
      : null,
    isLocked: Boolean(lockMeta.isLocked),
    requiresTitle: lockMeta.requiresTitle || null,
    seasonNumber: m.seasonNumber || 1,
    archived: Boolean(m.archived),
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

const resolveLockMeta = (milestone, byId) => {
  const reqId = milestone.requiresMilestoneId
    ? String(milestone.requiresMilestoneId._id || milestone.requiresMilestoneId)
    : null;
  if (!reqId) return { isLocked: false, requiresTitle: null };
  const prereq = byId.get(reqId);
  if (!prereq) return { isLocked: false, requiresTitle: null };
  const cleared = isMilestoneCleared(prereq);
  return {
    isLocked: !cleared,
    requiresTitle: prereq.title || 'Prerequisite quest',
  };
};

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { archived: { $ne: true } };
    if (category) filter.category = category;

    const milestones = await Milestone.find(filter)
      .populate('rewardItemId')
      .populate('requiresMilestoneId', 'title isCompleted subTasks archived')
      .sort({ category: 1, createdAt: 1 });

    const byId = new Map(milestones.map((m) => [String(m._id), m]));

    res.json(milestones.map((m) => formatMilestone(m, resolveLockMeta(m, byId))));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch milestones', error: error.message });
  }
});

/**
 * Archive a fully cleared UI group and clear it from the active board.
 * History is kept in MilestoneSeason; docs are soft-archived (not deleted).
 * Body: { groupKey: 'Career & Finance', ageGoal?: number }
 */
router.post('/seasons/start', async (req, res) => {
  try {
    const groupKey = String(req.body?.groupKey || '').trim();
    const ageGoal =
      req.body?.ageGoal != null && req.body.ageGoal !== ''
        ? Number(req.body.ageGoal)
        : null;

    if (!groupKey) {
      return res.status(400).json({ message: 'groupKey is required' });
    }

    const filter = {
      archived: { $ne: true },
      category: 'Level 20 Main Quest',
    };
    if (ageGoal != null && !Number.isNaN(ageGoal)) {
      filter.ageGoal = ageGoal;
    }

    const active = await Milestone.find(filter);
    const inGroup = active.filter((m) => inferQuestGroup(m.title) === groupKey);

    if (inGroup.length === 0) {
      return res.status(400).json({ message: `No active quests in “${groupKey}”` });
    }
    if (!inGroup.every((m) => isMilestoneCleared(m))) {
      return res.status(400).json({
        message: `Finish every quest in “${groupKey}” before starting a new season`,
      });
    }

    const seasonNumber =
      Math.max(0, ...inGroup.map((m) => m.seasonNumber || 1)) || 1;

    await MilestoneSeason.create({
      groupKey,
      ageGoal: ageGoal ?? inGroup[0].ageGoal ?? null,
      seasonNumber,
      archivedAt: new Date(),
      milestones: inGroup.map((m) => ({
        title: m.title,
        category: m.category,
        isCompleted: isMilestoneCleared(m),
        rewardType: m.rewardType,
        expReward: m.expReward,
        rewardStat: m.rewardStat,
        rewardStatAmount: m.rewardStatAmount,
        targetDate: m.targetDate,
        ageGoal: m.ageGoal,
        subTasks: (m.subTasks || []).map((st) => ({
          title: st.title,
          isCompleted: st.isCompleted,
        })),
        originalId: m._id,
      })),
    });

    await Milestone.updateMany(
      { _id: { $in: inGroup.map((m) => m._id) } },
      { $set: { archived: true } }
    );

    res.json({
      message: `Season ${seasonNumber} for “${groupKey}” archived. Add new quests in Mongo (or seed) for season ${
        seasonNumber + 1
      }.`,
      groupKey,
      seasonNumber,
      archivedCount: inGroup.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to start new season', error: error.message });
  }
});

router.get('/seasons', async (req, res) => {
  try {
    const seasons = await MilestoneSeason.find().sort({ archivedAt: -1 }).limit(50);
    res.json(
      seasons.map((s) => ({
        _id: s._id,
        groupKey: s.groupKey,
        ageGoal: s.ageGoal,
        seasonNumber: s.seasonNumber,
        archivedAt: s.archivedAt,
        questCount: (s.milestones || []).length,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: 'Failed to list seasons', error: error.message });
  }
});

router.post('/:id/subtasks/:subtaskId/toggle', async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id)
      .populate('rewardItemId')
      .populate('requiresMilestoneId', 'title isCompleted subTasks archived');
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
    if (milestone.archived) {
      return res.status(400).json({ message: 'Quest is archived from a past season' });
    }

    if (milestone.requiresMilestoneId) {
      const prereq = milestone.requiresMilestoneId;
      if (!isMilestoneCleared(prereq) || prereq.archived) {
        return res.status(403).json({
          message: `Quest locked — requires “${prereq.title}”`,
        });
      }
    }

    const subtask = milestone.subTasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ message: 'Sub-task not found' });

    subtask.isCompleted = !subtask.isCompleted;
    const allDone = milestone.subTasks.every((st) => st.isCompleted);
    milestone.isCompleted = allDone;
    await milestone.save();

    const all = await Milestone.find({ archived: { $ne: true } })
      .populate('rewardItemId')
      .populate('requiresMilestoneId', 'title isCompleted subTasks archived');
    const byId = new Map(all.map((m) => [String(m._id), m]));
    const fresh = all.find((m) => String(m._id) === String(milestone._id)) || milestone;

    res.json(formatMilestone(fresh, resolveLockMeta(fresh, byId)));
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle sub-task', error: error.message });
  }
});

module.exports = router;

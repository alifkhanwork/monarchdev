const mongoose = require('mongoose');

const subTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
  },
  { _id: true }
);

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['Level 20 Main Quest', 'SSR Gear Quest'],
      required: true,
    },
    isCompleted: { type: Boolean, default: false },
    rewardType: { type: String, enum: ['EXP', 'Item'], required: true },
    expReward: { type: Number, default: 0 },
    rewardStat: {
      type: String,
      enum: ['strength', 'intelligence', 'perception', 'vitality', 'agility', ''],
      default: '',
    },
    rewardStatAmount: { type: Number, default: 0 },
    targetDate: { type: Date, default: null },
    ageGoal: { type: Number, default: null },
    subTasks: [subTaskSchema],
    rewardItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
    /** Optional prerequisite milestone — null means unlocked (backward compatible). */
    requiresMilestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Milestone',
      default: null,
    },
    /** Soft-archive when a category season is refreshed — history kept via MilestoneSeason. */
    archived: { type: Boolean, default: false },
    seasonNumber: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Milestone', milestoneSchema);

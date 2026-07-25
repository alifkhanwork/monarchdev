const mongoose = require('mongoose');

const archivedMilestoneSchema = new mongoose.Schema(
  {
    title: String,
    category: String,
    isCompleted: Boolean,
    rewardType: String,
    expReward: Number,
    rewardStat: String,
    rewardStatAmount: Number,
    targetDate: Date,
    ageGoal: Number,
    subTasks: [
      {
        title: String,
        isCompleted: Boolean,
      },
    ],
    originalId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { _id: false }
);

const milestoneSeasonSchema = new mongoose.Schema(
  {
    groupKey: { type: String, required: true },
    ageGoal: { type: Number, default: null },
    seasonNumber: { type: Number, required: true },
    archivedAt: { type: Date, default: Date.now },
    milestones: { type: [archivedMilestoneSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MilestoneSeason', milestoneSeasonSchema);

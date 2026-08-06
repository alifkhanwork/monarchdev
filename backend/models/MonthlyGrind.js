const mongoose = require('mongoose');
const { TRACKING } = require('../utils/hunterMissions');

const TRACKING_ENUM = Object.values(TRACKING);

const monthlyGrindSchema = new mongoose.Schema(
  {
    missionKey: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Fitness', 'Health', 'Knowledge', 'Professional', 'Elite', 'Weekly', 'Monthly', 'Mental'],
      default: 'Fitness',
    },
    targetCount: { type: Number, required: true },
    currentProgress: { type: Number, default: 0 },
    periodKey: { type: String, required: true },
    trackingSource: {
      type: String,
      enum: TRACKING_ENUM,
      default: 'manual',
    },
    expReward: { type: Number, default: 0 },
    unit: { type: String, default: '' },
    sortOrder: { type: Number, default: 100 },
    isElite: { type: Boolean, default: false },
    eliteStatBoost: { type: Number, default: 0 },
    eliteBadgeId: { type: String, default: null },
    rewardClaimedPeriodKey: { type: String, default: null },
  },
  { timestamps: true }
);

monthlyGrindSchema.index({ periodKey: 1 });

module.exports = mongoose.model('MonthlyGrind', monthlyGrindSchema);

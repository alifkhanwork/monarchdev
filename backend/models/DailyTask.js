const mongoose = require('mongoose');

const STAT_MODIFIERS = ['strength', 'intelligence', 'perception', 'vitality', 'agility'];

const LIFETIME_METRICS = ['none', 'study_hours', 'water_liters', 'distance_km', 'steps'];

const statRewardSchema = new mongoose.Schema(
  {
    stat: { type: String, enum: STAT_MODIFIERS, required: true },
    amount: { type: Number, default: 1 },
  },
  { _id: false }
);

const dailyTaskSchema = new mongoose.Schema(
  {
    taskName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Foundation', 'Health', 'Mental', 'Professional', 'Productivity'],
      required: true,
    },
    expReward: {
      type: Number,
      required: true,
    },
    statModifier: {
      type: String,
      enum: STAT_MODIFIERS,
      required: true,
    },
    /** Multi-stat awards on complete (overrides single +1 if present). */
    statRewards: {
      type: [statRewardSchema],
      default: undefined,
    },
    lifetimeMetric: {
      type: String,
      enum: LIFETIME_METRICS,
      default: 'none',
    },
    defaultLogValue: {
      type: Number,
      default: 1,
    },
    logValue: {
      type: Number,
      default: 1,
    },
    lastCountedValue: {
      type: Number,
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    lastCompletedDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DailyTask', dailyTaskSchema);

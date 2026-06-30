const mongoose = require('mongoose');

const STAT_MODIFIERS = ['strength', 'intelligence', 'perception', 'vitality', 'agility'];

const LIFETIME_METRICS = ['none', 'study_hours', 'water_liters', 'distance_km'];

const dailyTaskSchema = new mongoose.Schema(
  {
    taskName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Foundation', 'Health', 'Mental', 'Professional'],
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

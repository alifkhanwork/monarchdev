const mongoose = require('mongoose');

const weeklyGrindSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, default: 'Weekly' },
    targetCount: { type: Number, required: true },
    currentProgress: { type: Number, default: 0 },
    periodKey: { type: String, required: true },
    /** manual = +/- stepper; workout / study_hours = derived from DailyMetricLog */
    trackingSource: {
      type: String,
      enum: ['manual', 'workout', 'study_hours'],
      default: 'manual',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WeeklyGrind', weeklyGrindSchema);

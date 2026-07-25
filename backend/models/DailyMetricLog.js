const mongoose = require('mongoose');

/** Per-calendar-day metrics for Weekly/Monthly Hunter Mission derivation. */
const dailyMetricLogSchema = new mongoose.Schema(
  {
    dateKey: { type: String, required: true, unique: true },
    workoutCompleted: { type: Boolean, default: false },
    isRecovery: { type: Boolean, default: false },
    cardioCompleted: { type: Boolean, default: false },
    studyHours: { type: Number, default: 0 },
    steps: { type: Number, default: 0 },
    waterLiters: { type: Number, default: 0 },
    proteinMeals: { type: Number, default: 0 },
    sleepDone: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DailyMetricLog', dailyMetricLogSchema);

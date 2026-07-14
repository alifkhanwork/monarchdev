const mongoose = require('mongoose');

/** Per-calendar-day canonical metrics used to derive Weekly/Monthly Grind progress. */
const dailyMetricLogSchema = new mongoose.Schema(
  {
    dateKey: { type: String, required: true, unique: true }, // YYYY-MM-DD (local)
    workoutCompleted: { type: Boolean, default: false },
    studyHours: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DailyMetricLog', dailyMetricLogSchema);

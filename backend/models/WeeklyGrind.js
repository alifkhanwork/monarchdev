const mongoose = require('mongoose');

const weeklyGrindSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, default: 'Weekly' },
    targetCount: { type: Number, required: true },
    currentProgress: { type: Number, default: 0 },
    periodKey: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WeeklyGrind', weeklyGrindSchema);

const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sets: { type: Number, required: true },
    repRange: { type: String, required: true },
    completed: { type: Boolean, default: false },
    lastCompletedDate: { type: Date, default: null },
  },
  { _id: true }
);

const workoutSchema = new mongoose.Schema(
  {
    dayType: {
      type: String,
      enum: ['Upper', 'Lower', 'Rest'],
      required: true,
      unique: true,
    },
    exercises: [exerciseSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Workout', workoutSchema);

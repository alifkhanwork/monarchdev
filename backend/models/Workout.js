const mongoose = require('mongoose');
const { WORKOUT_DAY_TYPES } = require('../utils/workoutRoutines');

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sets: { type: Number, required: true },
    repRange: { type: String, required: true },
    category: { type: String },
    completed: { type: Boolean, default: false },
    lastCompletedDate: { type: Date, default: null },
    trackingType: {
      type: String,
      enum: ['none', 'steps'],
      default: 'none',
    },
    stepTarget: { type: Number, default: 0 },
    currentSteps: { type: Number, default: 0 },
    lastStepsDate: { type: Date, default: null },
    setStructure: [
      {
        setNumber: { type: Number },
        type: { type: String, enum: ['warmup', 'working'] },
        suggestedWeight: { type: Number, default: null },
        targetReps: { type: String, default: '' },
      },
    ],
    loggedSets: [
      {
        setNumber: { type: Number },
        type: { type: String, enum: ['warmup', 'working'] },
        weightKg: { type: Number, default: null },
        reps: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
      },
    ],
    isPR: { type: Boolean, default: false },
  },
  { _id: true }
);

const workoutSchema = new mongoose.Schema(
  {
    dayType: {
      type: String,
      enum: WORKOUT_DAY_TYPES,
      required: true,
      unique: true,
    },
    exercises: [exerciseSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Workout', workoutSchema);

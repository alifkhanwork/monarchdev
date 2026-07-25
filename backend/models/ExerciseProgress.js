const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema(
  {
    dateKey: { type: String, required: true },
    weightKg: { type: Number, default: null },
    sets: [{ type: Number }],
    stage: { type: String, default: 'load' },
  },
  { _id: false }
);

const exerciseProgressSchema = new mongoose.Schema(
  {
    exerciseName: { type: String, required: true, unique: true },
    modality: {
      type: String,
      enum: ['dumbbell', 'bodyweight', 'cardio', 'mobility', 'steps'],
      default: 'dumbbell',
    },
    currentWeightKg: { type: Number, default: null },
    currentSets: { type: Number, default: 3 },
    currentRepRange: { type: String, default: '8–12' },
    progressStage: {
      type: String,
      // load → reps → eccentric → pause → sets → rest → variation
      enum: ['load', 'reps', 'eccentric', 'pause', 'sets', 'rest', 'variation'],
      default: 'load',
    },
    variationIndex: { type: Number, default: 0 },
    nextRecommendedWeightKg: { type: Number, default: null },
    coachNote: { type: String, default: '' },
    lastCompletedDate: { type: Date, default: null },
    timesPerformed: { type: Number, default: 0 },
    lastPerformance: {
      dateKey: { type: String, default: null },
      weightKg: { type: Number, default: null },
      sets: { type: [Number], default: [] },
    },
    bestPerformance: {
      dateKey: { type: String, default: null },
      weightKg: { type: Number, default: null },
      sets: { type: [Number], default: [] },
      totalReps: { type: Number, default: 0 },
    },
    personalRecord: {
      bestSingleSetReps: { type: Number, default: 0 },
      bestTotalReps: { type: Number, default: 0 },
      heaviestWeightKg: { type: Number, default: null },
    },
    recentSessions: { type: [performanceSchema], default: [] },
    plateauCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExerciseProgress', exerciseProgressSchema);

const mongoose = require('mongoose');

const setLogSchema = new mongoose.Schema(
  {
    setNumber: { type: Number, required: true },
    reps: { type: Number, required: true },
    weightKg: { type: Number, default: null },
  },
  { _id: false }
);

const sessionExerciseSchema = new mongoose.Schema(
  {
    exerciseName: { type: String, required: true },
    weightKg: { type: Number, default: null },
    targetSets: { type: Number, default: 1 },
    targetRepRange: { type: String, default: '' },
    sets: [setLogSchema],
    progressionStage: { type: String, default: 'load' },
    recommendation: { type: String, default: '' },
    verdict: {
      type: String,
      enum: ['progress', 'maintain', 'practice', 'plateau', 'skip'],
      default: 'maintain',
    },
  },
  { _id: false }
);

const workoutSessionSchema = new mongoose.Schema(
  {
    dateKey: { type: String, required: true, index: true },
    dayType: { type: String, required: true },
    workoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout', default: null },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    durationMin: { type: Number, default: null },
    exercises: [sessionExerciseSchema],
    coachSummary: {
      rating: { type: Number, default: 3 },
      headline: { type: String, default: '' },
      notes: { type: [String], default: [] },
    },
    totalVolumeKg: { type: Number, default: 0 },
  },
  { timestamps: true }
);

workoutSessionSchema.index({ dateKey: 1, dayType: 1 });

module.exports = mongoose.model('WorkoutSession', workoutSessionSchema);

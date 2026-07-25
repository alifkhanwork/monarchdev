const express = require('express');
const WorkoutSession = require('../models/WorkoutSession');
const ExerciseProgress = require('../models/ExerciseProgress');
const {
  logWorkoutSession,
  getAnalytics,
  getProgressMap,
  formatProgressCard,
} = require('../utils/progressService');
const {
  AVAILABLE_WEIGHTS,
  trainingWeekNumber,
  isBeginnerPhase,
  TRAINING_START,
} = require('../utils/progressiveOverload');

const router = express.Router();

router.get('/meta', (_req, res) => {
  res.json({
    trainingStart: TRAINING_START.toISOString().slice(0, 10),
    trainingWeek: trainingWeekNumber(),
    beginnerPhase: isBeginnerPhase(),
    availableWeights: AVAILABLE_WEIGHTS,
    method: 'double_progression',
  });
});

router.get('/exercises', async (_req, res) => {
  try {
    const docs = await ExerciseProgress.find().sort({ exerciseName: 1 });
    res.json({
      exercises: docs.map(formatProgressCard),
      availableWeights: AVAILABLE_WEIGHTS,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch exercise progress', error: error.message });
  }
});

router.get('/exercises/:name', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const doc = await ExerciseProgress.findOne({ exerciseName: name });
    if (!doc) return res.status(404).json({ message: 'Exercise not found' });
    res.json(formatProgressCard(doc));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch exercise', error: error.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 90);
    const sessions = await WorkoutSession.find()
      .sort({ dateKey: -1 })
      .limit(limit)
      .lean();
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history', error: error.message });
  }
});

router.get('/analytics', async (_req, res) => {
  try {
    const analytics = await getAnalytics();
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
});

router.get('/map', async (_req, res) => {
  try {
    res.json({ map: await getProgressMap() });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch progress map', error: error.message });
  }
});

/**
 * Body:
 * {
 *   dayType, workoutId?, durationMin?,
 *   exercises: [{ exerciseName, weightKg?, targetSets, targetRepRange, sets: [{ setNumber, reps, weightKg? }] }]
 * }
 */
router.post('/log-session', async (req, res) => {
  try {
    const { LIMITS, finiteNumber, clampInRange } = require('../utils/validateInput');
    const { dayType, workoutId, exercises, durationMin } = req.body || {};
    if (!dayType || !Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({
        message: 'dayType and exercises[] are required',
      });
    }

    let duration = undefined;
    if (durationMin != null && durationMin !== '') {
      duration = clampInRange(
        finiteNumber(durationMin, 'durationMin'),
        LIMITS.workoutDurationMin,
        LIMITS.workoutDurationMax,
        'durationMin'
      );
    }

    const sanitized = exercises.map((ex, i) => {
      if (!ex || !ex.exerciseName) {
        const err = new Error(`exercises[${i}].exerciseName is required`);
        err.statusCode = 400;
        throw err;
      }
      const sets = Array.isArray(ex.sets) ? ex.sets : [];
      if (sets.length === 0) {
        const err = new Error(`exercises[${i}].sets must be a non-empty array`);
        err.statusCode = 400;
        throw err;
      }
      return {
        ...ex,
        weightKg:
          ex.weightKg == null || ex.weightKg === ''
            ? null
            : clampInRange(
                finiteNumber(ex.weightKg, 'weightKg'),
                LIMITS.weightKgMin,
                LIMITS.weightKgMax,
                'weightKg'
              ),
        sets: sets.map((s, j) => ({
          ...s,
          reps: clampInRange(
            finiteNumber(s?.reps, `sets[${j}].reps`),
            LIMITS.repsMin,
            LIMITS.repsMax,
            'reps'
          ),
        })),
      };
    });

    const result = await logWorkoutSession({
      dayType,
      workoutId,
      exercises: sanitized,
      durationMin: duration,
    });

    res.json({
      message: 'Session logged',
      session: result.session,
      coach: result.coach,
      trainingWeek: result.trainingWeek,
      beginnerPhase: result.beginnerPhase,
      availableWeights: AVAILABLE_WEIGHTS,
    });
  } catch (error) {
    const code = error.statusCode || 500;
    res.status(code).json({ message: error.message || 'Failed to log session' });
  }
});

module.exports = router;

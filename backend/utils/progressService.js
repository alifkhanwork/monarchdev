const ExerciseProgress = require('../models/ExerciseProgress');
const WorkoutSession = require('../models/WorkoutSession');
const {
  localDateKey,
  getWeekDateKeys,
  getMonthDateKeys,
} = require('./dateHelpers');
const {
  classifyModality,
  defaultStartingWeight,
  evaluateExercise,
  buildCoachSummary,
  trainingWeekNumber,
  isBeginnerPhase,
  AVAILABLE_WEIGHTS,
  parseRepRange,
} = require('./progressiveOverload');

const ensureExerciseProgress = async (exerciseName, template = {}) => {
  let doc = await ExerciseProgress.findOne({ exerciseName });
  if (doc) return doc;

  const modality = classifyModality(exerciseName);
  const weight = defaultStartingWeight(exerciseName, modality);
  doc = await ExerciseProgress.create({
    exerciseName,
    modality,
    currentWeightKg: weight,
    currentSets: template.sets || 3,
    currentRepRange: template.repRange || '8–12',
    nextRecommendedWeightKg: weight,
    progressStage: 'load',
    coachNote: 'Week 1 baseline — earn progression with clean double-progression reps.',
  });
  return doc;
};

const formatProgressCard = (doc) => ({
  exerciseName: doc.exerciseName,
  modality: doc.modality,
  currentWeightKg: doc.currentWeightKg,
  currentSets: doc.currentSets,
  currentRepRange: doc.currentRepRange,
  progressStage: doc.progressStage,
  nextRecommendedWeightKg: doc.nextRecommendedWeightKg,
  coachNote: doc.coachNote,
  lastCompletedDate: doc.lastCompletedDate,
  timesPerformed: doc.timesPerformed,
  lastPerformance: doc.lastPerformance,
  bestPerformance: doc.bestPerformance,
  personalRecord: doc.personalRecord,
  plateauCount: doc.plateauCount,
  availableWeights: AVAILABLE_WEIGHTS,
});

const applySessionToProgress = async (exerciseName, payload, evaluation, dateKey) => {
  const doc = await ensureExerciseProgress(exerciseName, {
    sets: payload.targetSets,
    repRange: payload.targetRepRange,
  });

  const sets = (payload.sets || []).map((s) => Number(s.reps)).filter((n) => !Number.isNaN(n));
  const weight = payload.weightKg ?? doc.currentWeightKg;
  const totalReps = sets.reduce((a, b) => a + b, 0);

  doc.timesPerformed = (doc.timesPerformed || 0) + 1;
  doc.lastCompletedDate = new Date();
  doc.lastPerformance = { dateKey, weightKg: weight, sets };
  doc.currentSets = payload.targetSets || doc.currentSets;
  doc.currentRepRange = payload.targetRepRange || doc.currentRepRange;

  if (evaluation.verdict === 'progress') {
    if (evaluation.nextWeight != null) {
      doc.currentWeightKg = evaluation.nextWeight;
      doc.nextRecommendedWeightKg = evaluation.nextWeight;
    }
    doc.progressStage = evaluation.nextStage || doc.progressStage;
    doc.plateauCount = 0;
  } else {
    doc.nextRecommendedWeightKg =
      evaluation.nextWeight != null ? evaluation.nextWeight : doc.currentWeightKg;
    if (evaluation.verdict === 'plateau') {
      doc.plateauCount = (doc.plateauCount || 0) + 1;
    } else {
      doc.plateauCount = 0;
    }
  }

  doc.coachNote = evaluation.recommendation;

  const bestTotal = doc.bestPerformance?.totalReps || 0;
  if (totalReps >= bestTotal) {
    doc.bestPerformance = {
      dateKey,
      weightKg: weight,
      sets,
      totalReps,
    };
  }

  const bestSingle = Math.max(0, ...sets, doc.personalRecord?.bestSingleSetReps || 0);
  doc.personalRecord = {
    bestSingleSetReps: bestSingle,
    bestTotalReps: Math.max(totalReps, doc.personalRecord?.bestTotalReps || 0),
    heaviestWeightKg: Math.max(
      weight || 0,
      doc.personalRecord?.heaviestWeightKg || 0
    ) || null,
  };

  doc.recentSessions = [
    ...(doc.recentSessions || []),
    {
      dateKey,
      weightKg: weight,
      sets,
      stage: doc.progressStage,
    },
  ].slice(-12);

  await doc.save();
  return doc;
};

const logWorkoutSession = async ({
  dayType,
  workoutId,
  exercises,
  durationMin,
  date = new Date(),
}) => {
  const dateKey = localDateKey(date);
  const evaluations = [];
  const sessionExercises = [];
  let totalVolumeKg = 0;

  for (const ex of exercises || []) {
    const modality = classifyModality(ex.exerciseName);
    const progressDoc = await ensureExerciseProgress(ex.exerciseName, {
      sets: ex.targetSets,
      repRange: ex.targetRepRange,
    });

    const performed = (ex.sets || []).map((s) => Number(s.reps));
    const weight = ex.weightKg ?? progressDoc.currentWeightKg;

    const evaluation = evaluateExercise({
      exerciseName: ex.exerciseName,
      modality,
      weightKg: weight,
      targetSets: ex.targetSets || progressDoc.currentSets,
      repRange: ex.targetRepRange || progressDoc.currentRepRange,
      performedSets: performed,
      progressDoc,
      date,
    });

    evaluations.push({ exerciseName: ex.exerciseName, ...evaluation });

    if (modality !== 'cardio' && modality !== 'mobility' && modality !== 'steps') {
      await applySessionToProgress(
        ex.exerciseName,
        {
          targetSets: ex.targetSets,
          targetRepRange: ex.targetRepRange,
          weightKg: weight,
          sets: ex.sets,
        },
        evaluation,
        dateKey
      );
      for (const reps of performed) {
        totalVolumeKg += (weight || 0) * reps;
      }
    }

    sessionExercises.push({
      exerciseName: ex.exerciseName,
      weightKg: weight,
      targetSets: ex.targetSets,
      targetRepRange: ex.targetRepRange,
      sets: ex.sets,
      progressionStage: evaluation.nextStage,
      recommendation: evaluation.recommendation,
      verdict: evaluation.verdict,
    });
  }

  const coach = buildCoachSummary(evaluations);
  const existing = await WorkoutSession.findOne({ dateKey, dayType });
  const payload = {
    dateKey,
    dayType,
    workoutId: workoutId || null,
    completedAt: new Date(),
    durationMin: durationMin ?? null,
    exercises: sessionExercises,
    coachSummary: {
      rating: coach.rating,
      headline: coach.headline,
      notes: [...coach.notes, ...(coach.tips || []).map((t) => `Tip: ${t}`)],
    },
    totalVolumeKg: Math.round(totalVolumeKg),
  };

  let session;
  if (existing) {
    Object.assign(existing, payload);
    session = await existing.save();
  } else {
    session = await WorkoutSession.create(payload);
  }

  return {
    session,
    coach: {
      rating: coach.rating,
      headline: coach.headline,
      notes: coach.notes,
      tips: coach.tips,
      cards: evaluations.map((e) => ({
        exerciseName: e.exerciseName,
        verdict: e.verdict,
        recommendation: e.recommendation,
        nextWeight: e.nextWeight,
      })),
    },
    trainingWeek: trainingWeekNumber(date),
    beginnerPhase: isBeginnerPhase(date),
  };
};

const getAnalytics = async () => {
  const sessions = await WorkoutSession.find().sort({ dateKey: 1 }).lean();
  const week = getWeekDateKeys();
  const month = getMonthDateKeys();

  const inRange = (key, start, end) => key >= start && key <= end;

  const weeklyVolume = sessions
    .filter((s) => inRange(s.dateKey, week.startKey, week.endKey))
    .reduce((sum, s) => sum + (s.totalVolumeKg || 0), 0);

  const monthlyVolume = sessions
    .filter((s) => inRange(s.dateKey, month.startKey, month.endKey))
    .reduce((sum, s) => sum + (s.totalVolumeKg || 0), 0);

  const consistencyDays = new Set(sessions.map((s) => s.dateKey)).size;
  const avgVolume =
    sessions.length === 0
      ? 0
      : Math.round(
          sessions.reduce((s, x) => s + (x.totalVolumeKg || 0), 0) / sessions.length
        );
  const avgDuration =
    sessions.filter((s) => s.durationMin).length === 0
      ? null
      : Math.round(
          sessions
            .filter((s) => s.durationMin)
            .reduce((s, x) => s + x.durationMin, 0) /
            sessions.filter((s) => s.durationMin).length
        );

  const progressDocs = await ExerciseProgress.find().lean();
  let mostImproved = null;
  let strongest = null;
  for (const p of progressDocs) {
    if ((p.timesPerformed || 0) < 2) continue;
    const recent = p.recentSessions || [];
    if (recent.length >= 2) {
      const first = recent[0].sets?.reduce((a, b) => a + b, 0) || 0;
      const last = recent[recent.length - 1].sets?.reduce((a, b) => a + b, 0) || 0;
      const delta = last - first;
      if (!mostImproved || delta > mostImproved.delta) {
        mostImproved = { exerciseName: p.exerciseName, delta };
      }
    }
    const pr = p.personalRecord?.heaviestWeightKg || p.personalRecord?.bestTotalReps || 0;
    if (!strongest || pr > strongest.score) {
      strongest = {
        exerciseName: p.exerciseName,
        score: pr,
        detail: p.personalRecord,
      };
    }
  }

  const volumeByDay = sessions.map((s) => ({
    dateKey: s.dateKey,
    volumeKg: s.totalVolumeKg || 0,
    dayType: s.dayType,
    rating: s.coachSummary?.rating ?? null,
  }));

  return {
    weeklyVolumeKg: weeklyVolume,
    monthlyVolumeKg: monthlyVolume,
    averageSessionVolumeKg: avgVolume,
    averageDurationMin: avgDuration,
    sessionsLogged: sessions.length,
    uniqueTrainingDays: consistencyDays,
    mostImprovedExercise: mostImproved,
    strongestExercise: strongest,
    volumeByDay,
    trainingWeek: trainingWeekNumber(),
    beginnerPhase: isBeginnerPhase(),
    availableWeights: AVAILABLE_WEIGHTS,
  };
};

const seedProgressFromRoutine = async (routines) => {
  let created = 0;
  for (const routine of routines) {
    for (const ex of routine.exercises || []) {
      const modality = classifyModality(ex.name);
      if (modality === 'cardio' || modality === 'mobility' || modality === 'steps') continue;
      const existing = await ExerciseProgress.findOne({ exerciseName: ex.name });
      if (existing) continue;
      await ExerciseProgress.create({
        exerciseName: ex.name,
        modality,
        currentWeightKg: defaultStartingWeight(ex.name, modality),
        currentSets: ex.sets || 3,
        currentRepRange: ex.repRange || '8–12',
        nextRecommendedWeightKg: defaultStartingWeight(ex.name, modality),
        coachNote: 'Baseline set for training start July 27, 2026 (Week 1).',
      });
      created++;
    }
  }
  return created;
};

const getProgressMap = async () => {
  const docs = await ExerciseProgress.find().lean();
  const map = {};
  for (const d of docs) map[d.exerciseName] = formatProgressCard(d);
  return map;
};

module.exports = {
  ensureExerciseProgress,
  formatProgressCard,
  logWorkoutSession,
  getAnalytics,
  seedProgressFromRoutine,
  getProgressMap,
  parseRepRange,
};

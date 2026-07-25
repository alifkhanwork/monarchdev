const BADGE_DEFINITIONS = {
  study_hours: [
    { id: 'study_10', threshold: 10, name: 'Scholar' },
    { id: 'study_50', threshold: 50, name: 'Bookworm' },
    { id: 'study_100', threshold: 100, name: 'Sage' },
    { id: 'study_250', threshold: 250, name: 'Archivist' },
  ],
  workouts_completed: [
    { id: 'workout_10', threshold: 10, name: 'Initiate' },
    { id: 'workout_50', threshold: 50, name: 'Trainee' },
    { id: 'workout_100', threshold: 100, name: 'Warrior' },
    { id: 'workout_250', threshold: 250, name: 'Elite Hunter' },
    { id: 'workout_500', threshold: 500, name: 'Monarch' },
  ],
  water_liters: [
    { id: 'water_50', threshold: 50, name: 'Hydrated' },
    { id: 'water_200', threshold: 200, name: 'Wellspring' },
    { id: 'water_1000', threshold: 1000, name: 'Ocean Monarch' },
  ],
  distance_km: [
    { id: 'distance_50', threshold: 50, name: 'Pathfinder' },
    { id: 'distance_200', threshold: 200, name: 'Strider' },
    { id: 'distance_500', threshold: 500, name: 'Windrunner' },
    { id: 'distance_1000', threshold: 1000, name: 'Shadow Sprinter' },
    { id: 'distance_42', threshold: 42, name: 'Marathon Hunter' },
  ],
  total_steps: [
    { id: 'steps_50k', threshold: 50000, name: 'Pathfinder' },
    { id: 'steps_200k', threshold: 200000, name: 'Strider' },
    { id: 'steps_500k', threshold: 500000, name: 'Windrunner' },
    { id: 'steps_1m', threshold: 1000000, name: 'Shadow Sprinter' },
    { id: 'steps_marathon', threshold: 42195, name: 'Marathon Hunter' },
  ],
};

const METRIC_TO_STAT_KEY = {
  study_hours: 'studyHours',
  water_liters: 'waterLiters',
  distance_km: 'distanceKm',
  total_steps: 'totalSteps',
  active_recovery: 'activeRecoveryDays',
  weight_lifted: 'totalWeightLiftedKg',
};

const ensureLifetimeStats = (user) => {
  if (!user.lifetimeStats) {
    user.lifetimeStats = {};
  }
  const defaults = {
    studyHours: 0,
    workoutsCompleted: 0,
    waterLiters: 0,
    distanceKm: 0,
    totalSteps: 0,
    activeRecoveryDays: 0,
    totalWeightLiftedKg: 0,
  };
  for (const [k, v] of Object.entries(defaults)) {
    if (user.lifetimeStats[k] == null) user.lifetimeStats[k] = v;
  }
  if (!user.unlockedBadges) user.unlockedBadges = [];
  if (user.workoutStreak == null) user.workoutStreak = 0;
  if (user.bestWorkoutStreak == null) user.bestWorkoutStreak = 0;
  if (!user.personalRecords) {
    user.personalRecords = {
      mostPullUps: null,
      heaviestGobletSquatKg: null,
      longestPlankSec: null,
      longestWalkKm: null,
      fastest10kStepsMin: null,
    };
  }
};

const getMetricValue = (user, metricKey) => {
  ensureLifetimeStats(user);
  if (metricKey === 'workouts_completed') {
    return user.lifetimeStats.workoutsCompleted || 0;
  }
  const statKey = METRIC_TO_STAT_KEY[metricKey];
  return user.lifetimeStats[statKey] || 0;
};

const applyLifetimeDelta = (user, metric, delta) => {
  if (!metric || metric === 'none' || !delta) return;
  ensureLifetimeStats(user);

  if (metric === 'workouts_completed') {
    user.lifetimeStats.workoutsCompleted = Math.max(
      0,
      (user.lifetimeStats.workoutsCompleted || 0) + delta
    );
    return;
  }

  const statKey = METRIC_TO_STAT_KEY[metric];
  if (!statKey) return;
  user.lifetimeStats[statKey] = Math.max(0, (user.lifetimeStats[statKey] || 0) + delta);
};

const checkAndUnlockBadges = (user) => {
  ensureLifetimeStats(user);
  const newlyUnlocked = [];

  for (const [metricKey, badges] of Object.entries(BADGE_DEFINITIONS)) {
    const value = getMetricValue(user, metricKey);
    for (const badge of badges) {
      if (value >= badge.threshold && !user.unlockedBadges.includes(badge.id)) {
        user.unlockedBadges.push(badge.id);
        newlyUnlocked.push({ ...badge, metricKey });
      }
    }
  }

  return newlyUnlocked;
};

/** ~0.8m per step → km */
const stepsToKm = (steps) => Math.round((steps * 0.0008) * 100) / 100;

const formatLifetimeStatsResponse = (user) => {
  ensureLifetimeStats(user);
  const stats = user.lifetimeStats;

  const badges = {};
  for (const [metricKey, definitions] of Object.entries(BADGE_DEFINITIONS)) {
    const value = getMetricValue(user, metricKey);
    badges[metricKey] = definitions.map((b) => ({
      id: b.id,
      name: b.name,
      threshold: b.threshold,
      unlocked: user.unlockedBadges.includes(b.id),
      progress: value,
    }));
  }

  return {
    studyHours: stats.studyHours || 0,
    workoutsCompleted: stats.workoutsCompleted || 0,
    waterLiters: stats.waterLiters || 0,
    distanceKm: stats.distanceKm || 0,
    totalSteps: stats.totalSteps || 0,
    activeRecoveryDays: stats.activeRecoveryDays || 0,
    totalWeightLiftedKg: stats.totalWeightLiftedKg || 0,
    workoutStreak: user.workoutStreak || 0,
    bestWorkoutStreak: user.bestWorkoutStreak || 0,
    personalRecords: {
      mostPullUps: user.personalRecords?.mostPullUps ?? null,
      heaviestGobletSquatKg: user.personalRecords?.heaviestGobletSquatKg ?? null,
      longestPlankSec: user.personalRecords?.longestPlankSec ?? null,
      longestWalkKm: user.personalRecords?.longestWalkKm ?? null,
      fastest10kStepsMin: user.personalRecords?.fastest10kStepsMin ?? null,
    },
    badges,
  };
};

const countTaskTowardLifetime = (task) => {
  const amount = task.logValue ?? task.defaultLogValue ?? 1;
  return { metric: task.lifetimeMetric, amount };
};

module.exports = {
  BADGE_DEFINITIONS,
  ensureLifetimeStats,
  applyLifetimeDelta,
  checkAndUnlockBadges,
  formatLifetimeStatsResponse,
  countTaskTowardLifetime,
  stepsToKm,
};

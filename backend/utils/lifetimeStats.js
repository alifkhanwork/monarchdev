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
    { id: 'workout_250', threshold: 250, name: 'Vanguard' },
  ],
  water_liters: [
    { id: 'water_50', threshold: 50, name: 'Hydrated' },
    { id: 'water_200', threshold: 200, name: 'Wellspring' },
    { id: 'water_500', threshold: 500, name: 'Tidal Keeper' },
    { id: 'water_1000', threshold: 1000, name: 'Ocean Monarch' },
  ],
  distance_km: [
    { id: 'distance_50', threshold: 50, name: 'Pathfinder' },
    { id: 'distance_200', threshold: 200, name: 'Strider' },
    { id: 'distance_500', threshold: 500, name: 'Windrunner' },
    { id: 'distance_1000', threshold: 1000, name: 'Shadow Sprinter' },
  ],
};

const METRIC_TO_STAT_KEY = {
  study_hours: 'studyHours',
  water_liters: 'waterLiters',
  distance_km: 'distanceKm',
};

const ensureLifetimeStats = (user) => {
  if (!user.lifetimeStats) {
    user.lifetimeStats = {
      studyHours: 0,
      workoutsCompleted: 0,
      waterLiters: 0,
      distanceKm: 0,
    };
  }
  if (!user.unlockedBadges) {
    user.unlockedBadges = [];
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
};

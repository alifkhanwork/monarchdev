/** Shared input bounds for hunter metrics and free-text fields. */

const LIMITS = {
  waterLiters: { min: 0, max: 20 },
  studyHours: { min: 0, max: 16 },
  distanceKm: { min: 0, max: 200 },
  steps: { min: 0, max: 100_000 },
  pages: { min: 0, max: 2000 },
  journalMinChars: 10,
  journalMaxChars: 10_000,
  customQuestTitleMin: 2,
  customQuestTitleMax: 120,
  customQuestExpMin: 1,
  customQuestExpMax: 100,
  customQuestTargetMax: 10_000,
  ageMin: 10,
  ageMax: 120,
  grindDeltaMin: -100,
  grindDeltaMax: 100,
  stepDeltaAbsMax: 50_000,
  workoutDurationMin: 1,
  workoutDurationMax: 600,
  repsMin: 0,
  repsMax: 100,
  weightKgMin: 0,
  weightKgMax: 500,
};

function finiteNumber(value, label = 'value') {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    const err = new Error(`${label} must be a number`);
    err.statusCode = 400;
    throw err;
  }
  return n;
}

function clampInRange(n, min, max, label = 'value') {
  if (n < min || n > max) {
    const err = new Error(`${label} must be between ${min} and ${max}`);
    err.statusCode = 400;
    throw err;
  }
  return n;
}

function validateLogValue(metric, value) {
  const n = finiteNumber(value, 'log value');
  if (n < 0) {
    const err = new Error('log value cannot be negative');
    err.statusCode = 400;
    throw err;
  }
  const key =
    metric === 'water_liters'
      ? 'waterLiters'
      : metric === 'study_hours'
        ? 'studyHours'
        : metric === 'distance_km'
          ? 'distanceKm'
          : metric === 'steps'
            ? 'steps'
            : null;
  if (key) {
    return clampInRange(n, LIMITS[key].min, LIMITS[key].max, key);
  }
  return clampInRange(n, 0, 10_000, 'log value');
}

function validateJournalText(text, { allowEmpty = false } = {}) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) {
    if (allowEmpty) return '';
    const err = new Error('Journal text is required');
    err.statusCode = 400;
    throw err;
  }
  if (trimmed.length < LIMITS.journalMinChars) {
    const err = new Error(`Journal must be at least ${LIMITS.journalMinChars} characters`);
    err.statusCode = 400;
    throw err;
  }
  if (trimmed.length > LIMITS.journalMaxChars) {
    const err = new Error(`Journal must be at most ${LIMITS.journalMaxChars} characters`);
    err.statusCode = 400;
    throw err;
  }
  return trimmed;
}

function validateDateKey(dateKey) {
  const key = String(dateKey || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    const err = new Error('dateKey must be YYYY-MM-DD');
    err.statusCode = 400;
    throw err;
  }
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    const err = new Error('Invalid calendar date');
    err.statusCode = 400;
    throw err;
  }
  return key;
}

function validateAge(age) {
  return clampInRange(finiteNumber(age, 'age'), LIMITS.ageMin, LIMITS.ageMax, 'age');
}

function validateGrindDelta(delta) {
  const n = finiteNumber(delta, 'delta');
  if (n === 0) {
    const err = new Error('delta must be non-zero');
    err.statusCode = 400;
    throw err;
  }
  return clampInRange(n, LIMITS.grindDeltaMin, LIMITS.grindDeltaMax, 'delta');
}

function validateStepDelta(delta) {
  const n = finiteNumber(delta, 'delta');
  if (n === 0) {
    const err = new Error('delta must be a non-zero number');
    err.statusCode = 400;
    throw err;
  }
  return clampInRange(n, -LIMITS.stepDeltaAbsMax, LIMITS.stepDeltaAbsMax, 'delta');
}

function isPastDateKey(dateKey, todayKey) {
  return String(dateKey) < String(todayKey);
}

module.exports = {
  LIMITS,
  finiteNumber,
  clampInRange,
  validateLogValue,
  validateJournalText,
  validateDateKey,
  validateAge,
  validateGrindDelta,
  validateStepDelta,
  isPastDateKey,
};

/** Client-side mirrors of backend/utils/validateInput.js bounds. */

export const LIMITS = {
  waterLiters: { min: 0, max: 20 },
  studyHours: { min: 0, max: 16 },
  distanceKm: { min: 0, max: 200 },
  steps: { min: 0, max: 100_000 },
  journalMinChars: 10,
  journalMaxChars: 10_000,
  customQuestTitleMin: 2,
  customQuestTitleMax: 120,
  customQuestExpMin: 1,
  customQuestExpMax: 100,
  customQuestTargetMax: 10_000,
  ageMin: 10,
  ageMax: 120,
  workoutDurationMin: 1,
  workoutDurationMax: 600,
  repsMin: 0,
  repsMax: 100,
} as const;

export function clampLogValue(
  metric: string | undefined,
  value: number
): { ok: true; value: number } | { ok: false; message: string } {
  if (!Number.isFinite(value)) return { ok: false, message: 'Enter a valid number' };
  if (value < 0) return { ok: false, message: 'Value cannot be negative' };

  const caps: Record<string, { min: number; max: number; label: string }> = {
    water_liters: { ...LIMITS.waterLiters, label: 'Water (L)' },
    study_hours: { ...LIMITS.studyHours, label: 'Study hours' },
    distance_km: { ...LIMITS.distanceKm, label: 'Distance (km)' },
    steps: { ...LIMITS.steps, label: 'Steps' },
  };
  const cap = metric ? caps[metric] : undefined;
  if (cap && (value < cap.min || value > cap.max)) {
    return { ok: false, message: `${cap.label} must be between ${cap.min} and ${cap.max}` };
  }
  if (!cap && value > 10_000) {
    return { ok: false, message: 'Value is unreasonably large' };
  }
  return { ok: true, value };
}

export function validateJournalClient(text: string): { ok: true; text: string } | { ok: false; message: string } {
  const trimmed = text.trim();
  if (trimmed.length < LIMITS.journalMinChars) {
    return { ok: false, message: `Journal must be at least ${LIMITS.journalMinChars} characters` };
  }
  if (trimmed.length > LIMITS.journalMaxChars) {
    return { ok: false, message: `Journal must be at most ${LIMITS.journalMaxChars.toLocaleString()} characters` };
  }
  return { ok: true, text: trimmed };
}

export function validateCustomQuestTitle(title: string): { ok: true; title: string } | { ok: false; message: string } {
  const trimmed = title.trim();
  if (trimmed.length < LIMITS.customQuestTitleMin) {
    return { ok: false, message: 'Title must be at least 2 characters' };
  }
  if (trimmed.length > LIMITS.customQuestTitleMax) {
    return { ok: false, message: `Title must be at most ${LIMITS.customQuestTitleMax} characters` };
  }
  return { ok: true, title: trimmed };
}

export function isPastDateInput(dateStr: string, todayKey: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  return dateStr < todayKey;
}

import type { DayCompletionEntry, User, UserStats } from '@/types';

export interface InsightCard {
  id: string;
  label: string;
  value: string;
  detail: string;
}

const STAT_LABELS: { key: keyof UserStats; label: string }[] = [
  { key: 'strength', label: 'STR' },
  { key: 'vitality', label: 'VIT' },
  { key: 'intelligence', label: 'INT' },
  { key: 'perception', label: 'PER' },
  { key: 'agility', label: 'AGI' },
];

function weekdayIndex(dateKey: string): number {
  // dateKey is YYYY-MM-DD — parse as local noon to avoid TZ skew
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, 12).getDay(); // 0=Sun
}

function completionRate(entries: DayCompletionEntry[]): number | null {
  const scored = entries.filter((e) => e.status === 'complete' || e.status === 'incomplete');
  if (scored.length < 3) return null;
  const done = scored.filter((e) => e.status === 'complete').length;
  return Math.round((done / scored.length) * 100);
}

/** Derive 1–3 lightweight insights from existing user history fields. */
export function deriveInsights(user: User): InsightCard[] {
  const cards: InsightCard[] = [];
  const log = user.dayCompletionLog || [];

  // 1) Weekday vs weekend completion
  const weekday: DayCompletionEntry[] = [];
  const weekend: DayCompletionEntry[] = [];
  for (const e of log) {
    const dow = weekdayIndex(e.date);
    if (dow === 0 || dow === 6) weekend.push(e);
    else weekday.push(e);
  }
  const wdRate = completionRate(weekday);
  const weRate = completionRate(weekend);
  if (wdRate != null && weRate != null) {
    const lean =
      wdRate === weRate
        ? 'Even split'
        : wdRate > weRate
          ? 'Stronger on weekdays'
          : 'Stronger on weekends';
    cards.push({
      id: 'weekday-weekend',
      label: 'Weekday vs Weekend',
      value: `${wdRate}% · ${weRate}%`,
      detail: `${lean} (weekdays ${wdRate}% vs weekends ${weRate}% clear rate).`,
    });
  } else if (wdRate != null) {
    cards.push({
      id: 'weekday-rate',
      label: 'Weekday clear rate',
      value: `${wdRate}%`,
      detail: 'Not enough weekend samples yet for a comparison.',
    });
  }

  // 2) Stat growth from recent history snapshots
  const history = (user.statHistory || []).filter((h) => h.stats);
  if (history.length >= 2) {
    const recent = history.slice(-14);
    const first = recent[0];
    const last = recent[recent.length - 1];
    let best: { label: string; delta: number } | null = null;
    let worst: { label: string; delta: number } | null = null;
    for (const { key, label } of STAT_LABELS) {
      const delta = (last.stats[key] ?? 0) - (first.stats[key] ?? 0);
      if (!best || delta > best.delta) best = { label, delta };
      if (!worst || delta < worst.delta) worst = { label, delta };
    }
    if (best && (best.delta !== 0 || (worst && worst.delta !== 0))) {
      cards.push({
        id: 'stat-growth',
        label: 'Recent stat growth',
        value:
          best.delta > 0
            ? `${best.label} +${best.delta}`
            : best.delta === 0
              ? 'Flat'
              : `${best.label} ${best.delta}`,
        detail:
          worst && worst.label !== best.label
            ? `Across the last ${recent.length} snapshots, ${best.label} led (${
                best.delta >= 0 ? '+' : ''
              }${best.delta}); ${worst.label} trailed (${worst.delta >= 0 ? '+' : ''}${
                worst.delta
              }).`
            : `Across the last ${recent.length} snapshots.`,
      });
    }
  }

  // 3) Lifetime training signal (simple, always available when lifetimeStats exists)
  const life = user.lifetimeStats;
  if (life && cards.length < 3) {
    const workouts = life.workoutsCompleted || 0;
    const streak = life.workoutStreak || 0;
    if (workouts > 0 || streak > 0) {
      cards.push({
        id: 'training-signal',
        label: 'Training signal',
        value: `${workouts} sessions`,
        detail:
          streak > 0
            ? `Lifetime workouts logged with a ${streak}-day workout streak on the board.`
            : `${workouts} lifetime workout${workouts === 1 ? '' : 's'} logged.`,
      });
    }
  }

  // Fallback: streak if nothing else
  if (cards.length === 0 && user.streak) {
    cards.push({
      id: 'streak',
      label: 'Current streak',
      value: `${user.streak.current} days`,
      detail: `Best clear streak: ${Math.max(user.streak.best, user.streak.current)} days.`,
    });
  }

  return cards.slice(0, 3);
}

/** Skipped insights (documented for the product brief). */
export const SKIPPED_INSIGHTS = [
  {
    name: 'Quest category longest streak / highest completion',
    reason:
      'dayCompletionLog is day-level only (complete/incomplete/frozen) — no per-category history is stored.',
  },
] as const;

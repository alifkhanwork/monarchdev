'use client';

import type { LifetimeBadge, LifetimeStats, WeeklyProgress } from '@/types';

interface LifetimeStatsSectionProps {
  lifetimeStats: LifetimeStats;
  weeklyProgress?: WeeklyProgress;
  onGoTrain?: () => void;
  /** Which blocks to render. Default = all (backward compatible). */
  sections?: Array<'hunterProgress' | 'weeklyProgress' | 'personalRecords' | 'milestones'>;
}

const MAIN_STATS = [
  {
    key: 'workoutsCompleted' as const,
    icon: '⚔️',
    label: 'Total Workouts',
    format: (v: number) => `${v.toLocaleString()} sessions`,
    accent: 'text-glow-gold',
  },
  {
    key: 'totalWeightLiftedKg' as const,
    icon: '🏋️',
    label: 'Weight Lifted',
    format: (v: number) => `${v.toLocaleString()} kg est.`,
    accent: 'text-cyan-300',
  },
  {
    key: 'totalSteps' as const,
    icon: '👟',
    label: 'Lifetime Steps',
    format: (v: number) => `${v.toLocaleString()} steps`,
    accent: 'text-neon-teal',
  },
  {
    key: 'distanceKm' as const,
    icon: '🏃',
    label: 'Distance Walked',
    format: (v: number) => `${v.toLocaleString()} km`,
    accent: 'text-glow-gold',
  },
  {
    key: 'activeRecoveryDays' as const,
    icon: '🧘',
    label: 'Active Recovery',
    format: (v: number) => `${v.toLocaleString()} days`,
    accent: 'text-cyan-300',
  },
  {
    key: 'waterLiters' as const,
    icon: '💧',
    label: 'Water Consumed',
    format: (v: number) => `${v.toLocaleString()} L`,
    accent: 'text-cyan-300',
  },
  {
    key: 'studyHours' as const,
    icon: '📚',
    label: 'Study Hours',
    format: (v: number) => `${v.toLocaleString()} hrs`,
    accent: 'text-neon-teal',
  },
  {
    key: 'workoutStreak' as const,
    icon: '🔥',
    label: 'Workout Streak',
    format: (v: number) => `${v} day streak`,
    accent: 'text-glow-gold',
  },
];

const MILESTONE_GROUPS = [
  { badgeKey: 'workouts_completed' as const, label: 'Workout' },
  { badgeKey: 'distance_km' as const, label: 'Distance' },
  { badgeKey: 'water_liters' as const, label: 'Water' },
  { badgeKey: 'study_hours' as const, label: 'Study' },
];

const PR_CARDS = [
  { key: 'mostPullUps' as const, label: 'Most Pull-ups', suffix: 'reps' },
  { key: 'heaviestGobletSquatKg' as const, label: 'Heaviest Goblet Squat', suffix: 'kg' },
  { key: 'longestPlankSec' as const, label: 'Longest Plank', suffix: 'sec' },
  { key: 'longestWalkKm' as const, label: 'Longest Walk', suffix: 'km' },
  { key: 'fastest10kStepsMin' as const, label: 'Fastest 10K Steps', suffix: 'min' },
];

function BadgeChip({ badge }: { badge: LifetimeBadge }) {
  return (
    <span
      className={`lifetime-badge ${badge.unlocked ? 'lifetime-badge-unlocked' : 'lifetime-badge-locked'}`}
      title={`${badge.name} — ${badge.threshold.toLocaleString()}`}
    >
      {badge.unlocked && <span className="lifetime-badge-glow" aria-hidden />}
      {badge.name}
    </span>
  );
}

export default function LifetimeStatsSection({
  lifetimeStats,
  weeklyProgress,
  onGoTrain,
  sections = ['hunterProgress', 'weeklyProgress', 'personalRecords', 'milestones'],
}: LifetimeStatsSectionProps) {
  const weekly = weeklyProgress || {
    workoutsCompleted: 0,
    workoutsTarget: 5,
    recoveryCompleted: 0,
    recoveryTarget: 2,
    splitLabel: 'UL × PPL',
  };

  const hasAnyPr = PR_CARDS.some((pr) => lifetimeStats.personalRecords?.[pr.key] != null);
  const show = (id: (typeof sections)[number]) => sections.includes(id);

  return (
    <div className="space-y-2.5">
      {show('hunterProgress') && (
      <div className="glass-panel">
        <p className="panel-label mb-1">Hunter Progress</p>
        <p className="text-[10px] text-slate-400 mb-4">
          Lifetime totals from real training — consistency over perfection
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" data-stat-count={MAIN_STATS.length}>
          {MAIN_STATS.map((card) => {
            const value = lifetimeStats[card.key] ?? 0;
            return (
              <div key={card.key} className="lifetime-stat-card">
                <span className="text-xl mb-1 block" aria-hidden>
                  {card.icon}
                </span>
                <p className={`text-xl sm:text-2xl font-bold font-mono-data ${card.accent}`}>
                  {Number(value).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                  {card.label}
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">{card.format(Number(value))}</p>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {show('weeklyProgress') && (
      <div className="glass-panel">
        <p className="panel-label mb-1">Weekly Progress</p>
        <p className="text-[10px] text-slate-400 mb-3">Current week · Mon–Sun</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="lifetime-stat-card">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
              Weekly Workouts
            </p>
            <p className="text-2xl font-bold font-mono-data text-glow-gold">
              {weekly.workoutsCompleted} / {weekly.workoutsTarget}
            </p>
          </div>
          <div className="lifetime-stat-card">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
              Weekly Recovery
            </p>
            <p className="text-2xl font-bold font-mono-data text-neon-teal">
              {weekly.recoveryCompleted} / {weekly.recoveryTarget}
            </p>
          </div>
          <div className="lifetime-stat-card">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
              Current Split
            </p>
            <p className="text-2xl font-bold font-mono-data text-cyan-300">{weekly.splitLabel}</p>
          </div>
        </div>
      </div>
      )}

      {show('personalRecords') && (
      <div className="glass-panel">
        <p className="panel-label mb-1">Personal Records</p>
        {!hasAnyPr ? (
          <div className="text-center py-6 space-y-3">
            <p className="text-sm text-slate-300">
              Log your first set to start tracking PRs
            </p>
            <p className="text-meta">
              Complete a workout and submit performance — records appear here.
            </p>
            {onGoTrain && (
              <button type="button" className="journal-action-btn" onClick={onGoTrain}>
                Open Daily Grind
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-[10px] text-slate-400 mb-3">Lifetime bests from logged training</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {PR_CARDS.map((pr) => {
                const val = lifetimeStats.personalRecords?.[pr.key];
                return (
                  <div key={pr.key} className="lifetime-stat-card !py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">{pr.label}</p>
                    <p className="text-lg font-bold font-mono-data text-slate-200 mt-1">
                      {val != null ? `${val} ${pr.suffix}` : '—'}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      )}

      {show('milestones') && (
      <div className="glass-panel">
        <p className="panel-label mb-3">Milestones</p>
        <div className="space-y-4">
          {MILESTONE_GROUPS.map((group) => {
            const badges = lifetimeStats.badges[group.badgeKey] || [];
            return (
              <div key={group.badgeKey}>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <BadgeChip key={badge.id} badge={badge} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
}

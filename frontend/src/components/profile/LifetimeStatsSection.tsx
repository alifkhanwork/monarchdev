'use client';

import type { LifetimeBadge, LifetimeStats } from '@/types';

interface LifetimeStatsSectionProps {
  lifetimeStats: LifetimeStats;
}

const STAT_CARDS = [
  {
    key: 'studyHours' as const,
    badgeKey: 'study_hours' as const,
    icon: '📚',
    label: 'Study Hours',
    format: (v: number) => `${v.toLocaleString()} hrs studied`,
    accent: 'text-cyan-300',
  },
  {
    key: 'workoutsCompleted' as const,
    badgeKey: 'workouts_completed' as const,
    icon: '⚔️',
    label: 'Workouts Completed',
    format: (v: number) => `${v.toLocaleString()} workouts`,
    accent: 'text-glow-gold',
  },
  {
    key: 'waterLiters' as const,
    badgeKey: 'water_liters' as const,
    icon: '💧',
    label: 'Water Intake',
    format: (v: number) => `${v.toLocaleString()} L water`,
    accent: 'text-cyan-300',
  },
  {
    key: 'distanceKm' as const,
    badgeKey: 'distance_km' as const,
    icon: '🏃',
    label: 'Distance',
    format: (v: number) => `${v.toLocaleString()} km run`,
    accent: 'text-glow-gold',
  },
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

export default function LifetimeStatsSection({ lifetimeStats }: LifetimeStatsSectionProps) {
  return (
    <div className="glass-panel">
      <p className="panel-label mb-1">Lifetime Stats</p>
      <p className="text-[10px] text-slate-500 mb-5">
        Cumulative totals from daily quest completions
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          const value = lifetimeStats[card.key];
          return (
            <div key={card.key} className="lifetime-stat-card">
              <span className="text-2xl mb-2" aria-hidden>
                {card.icon}
              </span>
              <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${card.accent}`}>
                {value.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                {card.format(value)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        {STAT_CARDS.map((card) => {
          const badges = lifetimeStats.badges[card.badgeKey] || [];
          return (
            <div key={card.badgeKey}>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                {card.label} Milestones
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
  );
}

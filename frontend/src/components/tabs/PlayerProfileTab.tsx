'use client';

import type { User } from '@/types';
import StatRadarChart from '@/components/profile/StatRadarChart';
import StatSparkline from '@/components/profile/StatSparkline';
import RankPreview from '@/components/profile/RankPreview';
import GearCard from '@/components/profile/GearCard';
import LockedGearSlot from '@/components/profile/LockedGearSlot';
import StreakCalendar from '@/components/profile/StreakCalendar';
import LifetimeStatsSection from '@/components/profile/LifetimeStatsSection';

interface PlayerProfileTabProps {
  user: User;
  onTitleChange: (title: string) => void;
}

const STAT_LABELS: Record<string, string> = {
  strength: 'STR',
  intelligence: 'INT',
  perception: 'PER',
  vitality: 'VIT',
  agility: 'AGI',
};

export default function PlayerProfileTab({ user, onTitleChange }: PlayerProfileTabProps) {
  const stats = user.effectiveStats ?? user.stats;
  const history = user.statHistory || [];

  const getHistoryValues = (key: keyof typeof stats) =>
    history.map((h) => h.stats[key] ?? stats[key]);

  return (
    <div className="tab-content space-y-4">
      <div className="glass-panel flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-400/60">Hunter Profile</p>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">{user.username}</h2>
          <p className="text-sm text-amber-400/80 mt-0.5">{user.equippedTitle}</p>
          <RankPreview
            currentTitle={user.equippedTitle}
            nextRank={user.nextRank}
            level={user.level}
            totalPower={user.totalPower}
          />
        </div>
        <select
          value={user.equippedTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-sm bg-slate-950/60 border border-cyan-500/25 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-400/50 max-w-xs shrink-0"
        >
          {user.availableTitles.map((title) => (
            <option key={title} value={title}>
              {title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel flex flex-col py-6 min-h-[400px]">
          <p className="panel-label mb-4 px-4">Core Attributes</p>
          <StatRadarChart stats={user.stats} effectiveStats={user.effectiveStats} />

          <div className="grid grid-cols-1 gap-1.5 mt-4 px-4">
            {(Object.keys(STAT_LABELS) as Array<keyof typeof stats>).map((key) => (
              <StatSparkline
                key={key}
                label={STAT_LABELS[key]}
                values={getHistoryValues(key)}
                current={stats[key]}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel text-center py-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Total Power</p>
            <p className="text-5xl sm:text-6xl font-bold text-glow-gold tabular-nums">
              {user.totalPower.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wider">
              Base stats + gear multipliers + level bonus
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <GearCard item={user.equippedWeapon} slot="weapon" emptyLabel="No weapon equipped" />
            <GearCard item={user.equippedRelic} slot="relic" emptyLabel="No relic equipped" />
            <LockedGearSlot slotName="Armor Slot" unlockHint="Unlock at Level 10" />
            <LockedGearSlot slotName="Accessory Slot" unlockHint="Complete an SSR Gear Quest" />
          </div>
        </div>
      </div>

      <StreakCalendar
        dayCompletionLog={user.dayCompletionLog || []}
        currentStreak={user.streak.current}
        bestStreak={user.streak.best}
      />

      {user.lifetimeStats && <LifetimeStatsSection lifetimeStats={user.lifetimeStats} />}
    </div>
  );
}

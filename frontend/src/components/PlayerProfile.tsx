'use client';

import type { User } from '@/types';
import StatRadarChart from './StatRadarChart';

interface PlayerProfileProps {
  user: User;
}

export default function PlayerProfile({ user }: PlayerProfileProps) {
  const expPercent = Math.min((user.currentExp / user.expToNextLevel) * 100, 100);

  return (
    <div className="panel h-full flex flex-col gap-4">
      <div className="panel-header">
        <span className="panel-label">Player Status</span>
        <span className="text-system-gold text-sm font-semibold">Lv. {user.level}</span>
      </div>

      <div className="text-center px-2">
        <h2 className="text-lg font-bold text-white leading-tight">{user.username}</h2>
        <p className="text-xs text-system-accent mt-1 uppercase tracking-wider">
          {user.equippedTitle}
        </p>
      </div>

      <div className="px-1">
        <div className="flex justify-between text-xs text-system-muted mb-1">
          <span>EXP</span>
          <span>
            {user.currentExp} / {user.expToNextLevel}
          </span>
        </div>
        <div className="h-2 bg-system-bg rounded-full overflow-hidden border border-system-border/50">
          <div
            className="h-full bg-gradient-to-r from-system-glow/80 to-system-accent rounded-full transition-all duration-500"
            style={{ width: `${expPercent}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <p className="text-xs uppercase tracking-widest text-system-muted text-center mb-2">
          Core Stats
        </p>
        <StatRadarChart stats={user.stats} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {Object.entries(user.stats).map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between px-3 py-2 rounded border border-system-border/40 bg-system-bg/50"
          >
            <span className="text-system-muted capitalize">{key.slice(0, 3)}</span>
            <span className="text-system-accent font-semibold">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

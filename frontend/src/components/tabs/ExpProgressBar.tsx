'use client';

import type { FreezeHistoryEntry } from '@/types';
import { FreezeHistoryPanel } from './DayStatusSelect';

interface ExpProgressBarProps {
  level: number;
  currentExp: number;
  expToNextLevel: number;
  currentStreak?: number;
  bestStreak?: number;
  freezeHistory?: FreezeHistoryEntry[];
}

export default function ExpProgressBar({
  level,
  currentExp,
  expToNextLevel,
  currentStreak = 0,
  bestStreak = 0,
  freezeHistory = [],
}: ExpProgressBarProps) {
  const percent = Math.min((currentExp / expToNextLevel) * 100, 100);

  return (
    <div className="glass-panel p-4 sm:p-5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-center min-w-[56px]">
              <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/60">Level</p>
              <p className="text-3xl font-bold text-glow-cyan tabular-nums leading-none">{level}</p>
            </div>
            <div className="h-10 w-px bg-cyan-500/20" />
            <div className="text-center min-w-[56px]">
              <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/60">Streak</p>
              <p className="text-2xl font-bold text-glow-cyan tabular-nums leading-none">
                {currentStreak}
              </p>
            </div>
            <div className="text-center min-w-[56px]">
              <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/60">Best</p>
              <p className="text-2xl font-bold text-cyan-300/80 tabular-nums leading-none">
                {bestStreak}
              </p>
            </div>
          </div>
          <FreezeHistoryPanel history={freezeHistory} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-400 uppercase tracking-wider">Experience</span>
            <span className="text-cyan-300 font-semibold tabular-nums">
              {currentExp.toLocaleString()} / {expToNextLevel.toLocaleString()} EXP
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-900/80 border border-cyan-500/20 overflow-hidden">
            <div
              className="exp-bar-fill h-full rounded-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-teal-300 shadow-[0_0_12px_rgba(34,211,238,0.5)]"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5 text-right tabular-nums">
            {percent.toFixed(1)}% to Level {level + 1}
          </p>
        </div>
      </div>
    </div>
  );
}

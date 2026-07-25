'use client';

import type { FreezeHistoryEntry } from '@/types';
import { FreezeHistoryPanel } from './DayStatusSelect';

interface ExpProgressBarProps {
  level: number;
  currentExp: number;
  expToNextLevel: number;
  currentStreak?: number;
  bestStreak?: number;
  questDone?: number;
  questTotal?: number;
  freezeHistory?: FreezeHistoryEntry[];
  sticky?: boolean;
  /** Brief pulse when EXP was just awarded */
  expPulse?: boolean;
  lastExpGain?: number | null;
}

export default function ExpProgressBar({
  level,
  currentExp,
  expToNextLevel,
  currentStreak = 0,
  bestStreak = 0,
  questDone,
  questTotal,
  freezeHistory = [],
  sticky = false,
  expPulse = false,
  lastExpGain = null,
}: ExpProgressBarProps) {
  const percent = Math.min((currentExp / expToNextLevel) * 100, 100);

  return (
    <div className={sticky ? 'sticky-hud' : 'glass-panel !py-2 !px-3'}>
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-baseline gap-1 px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10">
            <span className="text-[9px] uppercase tracking-wider text-cyan-400/70 hidden xs:inline">Lv</span>
            <span className="text-lg sm:text-xl font-bold text-glow-cyan font-mono-data leading-none">
              {level}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px]">
            <span className="text-slate-500">
              Streak <strong className="text-neon-teal font-mono-data">{currentStreak}</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500">
              Best{' '}
              <strong className="text-amber-300/90 font-mono-data">
                {Math.max(bestStreak, currentStreak)}
              </strong>
            </span>
          </div>
          <div className="flex sm:hidden items-center gap-1.5 text-[10px] font-mono-data text-slate-400">
            <span className="text-neon-teal">{currentStreak}</span>
            <span>/</span>
            <span className="text-amber-300/80">{Math.max(bestStreak, currentStreak)}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className="flex-1 min-w-0 relative">
            <div className="progress-track !h-2">
              <div
                className={`exp-bar-fill h-full rounded-full bg-gradient-to-r from-cyan-600 via-[#00E5FF] to-teal-300 shadow-[0_0_10px_rgba(0,229,255,0.45)] ${
                  expPulse ? 'exp-bar-pulse' : ''
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            {expPulse && lastExpGain != null && lastExpGain > 0 && (
              <span className="exp-float absolute -top-4 right-0 text-[11px] font-bold font-mono-data text-amber-300">
                +{lastExpGain}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] sm:text-[11px] text-neon-teal font-mono-data shrink-0 whitespace-nowrap ${
              expPulse ? 'exp-num-pulse' : ''
            }`}
          >
            {currentExp}/{expToNextLevel}
            <span className="text-slate-500 ml-1 hidden sm:inline">{percent.toFixed(0)}%</span>
          </span>
        </div>

        {questDone != null && questTotal != null && (
          <span className="shrink-0 text-[11px] font-mono-data text-amber-300/90 px-1.5 py-0.5 rounded border border-amber-500/25 bg-amber-500/10">
            {questDone}/{questTotal}
          </span>
        )}
      </div>
      {freezeHistory.length > 0 && (
        <div className="mt-1 hidden sm:block">
          <FreezeHistoryPanel history={freezeHistory} />
        </div>
      )}
    </div>
  );
}

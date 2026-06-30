'use client';

import type { DayCompletionEntry } from '@/types';

interface StreakCalendarProps {
  dayCompletionLog: DayCompletionEntry[];
  currentStreak: number;
  bestStreak: number;
}

const STATUS_STYLES: Record<DayCompletionEntry['status'], string> = {
  complete: 'bg-cyan-500/40 border-cyan-400/50',
  incomplete: 'bg-red-500/20 border-red-500/30',
  frozen: 'bg-amber-500/20 border-amber-400/40',
};

function getLastNDays(n: number): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export default function StreakCalendar({
  dayCompletionLog,
  currentStreak,
  bestStreak,
}: StreakCalendarProps) {
  const days = getLastNDays(28);
  const logMap = new Map(dayCompletionLog.map((e) => [e.date, e.status]));
  const todayKey = new Date().toISOString().split('T')[0];

  return (
    <div className="glass-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="panel-label">Streak Calendar</p>
          <p className="text-[10px] text-slate-500 mt-1">Last 28 days — complete, missed, or frozen</p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="text-cyan-300">
            Current: <strong className="tabular-nums">{currentStreak}</strong>
          </span>
          <span className="text-amber-400/80">
            Best: <strong className="tabular-nums">{bestStreak}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((date) => {
          const status = logMap.get(date);
          const isToday = date === todayKey;
          const dayNum = new Date(date + 'T12:00:00').getDate();

          return (
            <div
              key={date}
              title={`${date}${status ? ` — ${status}` : ''}`}
              className={`aspect-square rounded-md border flex items-center justify-center text-[10px] sm:text-xs tabular-nums ${
                status
                  ? STATUS_STYLES[status]
                  : 'bg-slate-900/50 border-slate-700/40 text-slate-600'
              } ${isToday ? 'ring-1 ring-cyan-400/60' : ''}`}
            >
              {dayNum}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-slate-500 uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/40 border border-cyan-400/50" />
          Complete
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500/20 border border-red-500/30" />
          Missed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/20 border border-amber-400/40" />
          Frozen
        </span>
      </div>
    </div>
  );
}

'use client';

import type { DayCompletionEntry } from '@/types';
import { formatJournalDateLabel, getTodayKey, hasJournalForDate } from '@/lib/journalStorage';

interface StreakCalendarProps {
  dayCompletionLog: DayCompletionEntry[];
  currentStreak: number;
  bestStreak: number;
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
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
  selectedDate,
  onSelectDate,
}: StreakCalendarProps) {
  const days = getLastNDays(28);
  const logMap = new Map(dayCompletionLog.map((e) => [e.date, e.status]));
  const todayKey = getTodayKey();

  return (
    <div className="glass-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="panel-label">Streak Calendar</p>
          <p className="text-[10px] text-slate-500 mt-1">
            Click a day to view or edit its journal
          </p>
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
          const isSelected = date === selectedDate;
          const dayNum = new Date(date + 'T12:00:00').getDate();
          const hasJournal = hasJournalForDate(date);

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              title={`${formatJournalDateLabel(date)}${status ? ` — ${status}` : ''}${hasJournal ? ' — journal saved' : ''}`}
              className={`aspect-square rounded-md border flex flex-col items-center justify-center text-[10px] sm:text-xs tabular-nums transition-all hover:brightness-125 ${
                status
                  ? STATUS_STYLES[status]
                  : 'bg-slate-900/50 border-slate-700/40 text-slate-600'
              } ${isToday ? 'ring-1 ring-cyan-400/60' : ''} ${
                isSelected ? 'ring-2 ring-cyan-400 scale-105 z-10' : ''
              }`}
            >
              <span>{dayNum}</span>
              {hasJournal && (
                <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" aria-hidden />
              )}
            </button>
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
        <span className="flex items-center gap-1.5 normal-case">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Journal saved
        </span>
      </div>
    </div>
  );
}

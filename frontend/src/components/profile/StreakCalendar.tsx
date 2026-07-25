'use client';

import { useMemo, useState } from 'react';
import type { DayCompletionEntry } from '@/types';
import { formatJournalDateLabel, getTodayKey, hasJournalForDate } from '@/lib/journalStorage';

interface StreakCalendarProps {
  dayCompletionLog: DayCompletionEntry[];
  currentStreak: number;
  bestStreak: number;
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  /** 0 = Sunday, 1 = Monday (default). */
  weekStartsOn?: 0 | 1;
}

const STATUS_CLASS: Record<DayCompletionEntry['status'] | 'empty' | 'journal', string> = {
  complete: 'bg-cyan-500/55 border-cyan-400/40',
  incomplete: 'bg-red-500/35 border-red-500/30',
  frozen: 'bg-amber-500/35 border-amber-400/35',
  empty: 'bg-slate-800/60 border-slate-700/40',
  journal: 'ring-1 ring-emerald-400/70',
};

function startOfWeek(d: Date, weekStartsOn: 0 | 1) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = weekStartsOn === 1 ? (day + 6) % 7 : day;
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toLocalKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function StreakCalendar({
  dayCompletionLog,
  currentStreak,
  bestStreak,
  selectedDate,
  onSelectDate,
  weekStartsOn = 1,
}: StreakCalendarProps) {
  const [fullYear, setFullYear] = useState(false);
  const weeksVisible = fullYear ? 52 : 10;
  const logMap = useMemo(
    () => new Map(dayCompletionLog.map((e) => [e.date, e.status])),
    [dayCompletionLog]
  );
  const todayKey = getTodayKey();

  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = startOfWeek(today, weekStartsOn);
    end.setDate(end.getDate() + 6);
    const start = startOfWeek(today, weekStartsOn);
    start.setDate(start.getDate() - (weeksVisible - 1) * 7);

    const cols: string[][] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const col: string[] = [];
      for (let i = 0; i < 7; i++) {
        col.push(toLocalKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      cols.push(col);
    }
    return cols;
  }, [weeksVisible, weekStartsOn]);

  return (
    <div className="glass-panel !py-2.5 !px-3">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <p className="panel-label">Streak Heatmap</p>
          <span className="text-meta hidden sm:inline">Tap a day to open its journal</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono-data">
          <span className="text-cyan-300">
            Current <strong>{currentStreak}</strong>
          </span>
          <span className="text-amber-300/80">
            Best <strong>{bestStreak}</strong>
          </span>
          <button
            type="button"
            onClick={() => setFullYear((v) => !v)}
            className="text-[10px] uppercase tracking-wider text-slate-400 hover:text-neon-teal border border-slate-700/50 rounded px-2 py-1 min-h-[32px]"
          >
            {fullYear ? 'Last 10 wks' : 'Full year'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar pb-1">
        <div className="inline-flex gap-[3px] min-w-0">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((date) => {
                const status = logMap.get(date);
                const hasJournal = hasJournalForDate(date);
                const isFuture = date > todayKey;
                const isSelected = date === selectedDate;
                const isToday = date === todayKey;
                const cls = isFuture
                  ? 'bg-transparent border-transparent'
                  : STATUS_CLASS[status ?? 'empty'];

                return (
                  <button
                    key={date}
                    type="button"
                    disabled={isFuture}
                    onClick={() => onSelectDate(date)}
                    title={`${formatJournalDateLabel(date)}${status ? ` — ${status}` : ''}${
                      hasJournal ? ' — journal saved' : ''
                    }`}
                    className={`heatmap-cell ${cls} ${hasJournal && !isFuture ? STATUS_CLASS.journal : ''} ${
                      isToday ? 'outline outline-1 outline-cyan-300/80' : ''
                    } ${isSelected ? 'outline outline-2 outline-offset-1 outline-cyan-400' : ''} ${
                      isFuture ? 'cursor-default' : 'hover:brightness-125'
                    }`}
                    aria-label={formatJournalDateLabel(date)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className={`heatmap-cell ${STATUS_CLASS.complete}`} /> Complete
        </span>
        <span className="flex items-center gap-1">
          <span className={`heatmap-cell ${STATUS_CLASS.incomplete}`} /> Missed
        </span>
        <span className="flex items-center gap-1">
          <span className={`heatmap-cell ${STATUS_CLASS.frozen}`} /> Frozen
        </span>
        <span className="flex items-center gap-1">
          <span className={`heatmap-cell ${STATUS_CLASS.empty} ${STATUS_CLASS.journal}`} /> Journal
        </span>
        <span className="text-slate-600">
          Weeks start {weekStartsOn === 0 ? 'Sunday' : 'Monday'}
        </span>
      </div>
    </div>
  );
}

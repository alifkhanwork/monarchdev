'use client';

import { useState } from 'react';
import type { FreezeHistoryEntry } from '@/types';

const STATUS_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'rest', label: 'Rest Day' },
  { value: 'sick', label: 'Sick Day' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'busy', label: 'Busy (Work/School)' },
] as const;

interface DayStatusSelectProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  disabled?: boolean;
}

export default function DayStatusSelect({
  currentStatus,
  onStatusChange,
  disabled,
}: DayStatusSelectProps) {
  return (
    <select
      value={currentStatus}
      onChange={(e) => onStatusChange(e.target.value)}
      disabled={disabled}
      className="text-[10px] bg-slate-950/70 border border-cyan-500/25 rounded px-2 py-1 text-cyan-300/90 focus:outline-none focus:border-cyan-400/50 uppercase tracking-wider font-semibold"
      aria-label="Day status"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          Status: {opt.label}
        </option>
      ))}
    </select>
  );
}

interface FreezeHistoryPanelProps {
  history: FreezeHistoryEntry[];
}

export function FreezeHistoryPanel({ history }: FreezeHistoryPanelProps) {
  const [open, setOpen] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-[10px] text-cyan-400/60 hover:text-cyan-300 uppercase tracking-wider"
      >
        {open ? '▼' : '▶'} Freeze History ({history.length})
      </button>
      {open && (
        <ul className="mt-1.5 space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
          {history.map((entry) => (
            <li
              key={entry.date}
              className="text-[10px] text-slate-500 flex justify-between gap-2"
            >
              <span>{entry.date}</span>
              <span className="text-slate-400">{entry.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

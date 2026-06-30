'use client';

interface JournalPanelProps {
  journalEntry: string;
  onJournalChange: (value: string) => void;
  isFrozenDay?: boolean;
}

export default function JournalPanel({
  journalEntry,
  onJournalChange,
  isFrozenDay = false,
}: JournalPanelProps) {
  const journalFilled = journalEntry.trim().length >= 10;
  const charCount = journalEntry.trim().length;

  return (
    <div className="glass-panel h-full flex flex-col min-h-[320px] lg:min-h-0">
      <div className="panel-header">
        <div>
          <span className="panel-label">End of Day Journal</span>
          <p className="text-[10px] text-slate-500 mt-1">
            {isFrozenDay ? 'Optional on frozen days' : 'Required to complete the journal daily quest'}
          </p>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wider ${
            journalFilled
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
          }`}
        >
          {journalFilled ? 'Ready' : 'Pending'}
        </span>
      </div>

      <textarea
        value={journalEntry}
        onChange={(e) => onJournalChange(e.target.value)}
        placeholder="Reflect on today — wins, lessons, struggles, and tomorrow's focus..."
        className="journal-textarea flex-1 mt-3 min-h-[240px] lg:min-h-0"
      />

      <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500">
        <span>{journalFilled ? '✓ Journal quest unlocked' : 'Minimum 10 characters required'}</span>
        <span className="tabular-nums">{charCount} chars</span>
      </div>
    </div>
  );
}

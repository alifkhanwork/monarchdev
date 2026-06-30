'use client';

import type { Milestone, User } from '@/types';

interface InventoryPanelProps {
  user: User;
  milestones: Milestone[];
  journalEntry: string;
  onJournalChange: (value: string) => void;
  onTitleChange: (title: string) => void;
}

export default function InventoryPanel({
  user,
  milestones,
  journalEntry,
  onJournalChange,
  onTitleChange,
}: InventoryPanelProps) {
  const journalFilled = journalEntry.trim().length >= 10;

  return (
    <div className="panel h-full flex flex-col gap-4 overflow-hidden">
      <div className="panel-header">
        <span className="panel-label">Inventory & Milestones</span>
      </div>

      <section>
        <h3 className="text-xs uppercase tracking-widest text-system-muted mb-2">
          Equipped Title
        </h3>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-system-gold/30 bg-gradient-to-br from-system-gold/5 to-transparent">
          <div className="w-12 h-12 rounded-full border-2 border-system-gold/50 flex items-center justify-center text-system-gold text-xl shrink-0">
            ★
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-system-gold truncate">
              {user.equippedTitle}
            </p>
            <select
              value={user.equippedTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="mt-1 w-full text-xs bg-system-bg border border-system-border rounded px-2 py-1.5 text-system-muted focus:outline-none focus:border-system-glow"
            >
              {user.availableTitles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="flex-1 overflow-y-auto custom-scrollbar">
        <h3 className="text-xs uppercase tracking-widest text-system-muted mb-2">
          Level 20 Main Quests
        </h3>
        <div className="space-y-2">
          {milestones.map((milestone) => (
            <div
              key={milestone._id}
              className={`milestone-card ${milestone.isCompleted ? 'milestone-done' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-system-danger/20 text-system-danger border border-system-danger/30 font-bold">
                    SSR
                  </span>
                  <p className={`text-sm font-medium mt-1.5 ${milestone.isCompleted ? 'line-through text-system-muted' : 'text-white'}`}>
                    {milestone.title}
                  </p>
                </div>
                <span className="text-xs text-system-gold shrink-0">+{milestone.expReward}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="shrink-0">
        <h3 className="text-xs uppercase tracking-widest text-system-muted mb-2">
          End of Day Journal
          <span className="text-system-danger ml-1">*</span>
        </h3>
        <textarea
          value={journalEntry}
          onChange={(e) => onJournalChange(e.target.value)}
          placeholder="Reflect on today: wins, lessons, tomorrow's focus..."
          rows={4}
          className="journal-textarea"
        />
        <p className="text-[10px] text-system-muted mt-1">
          {journalFilled
            ? '✓ Journal complete — daily quest unlocked'
            : 'Required to complete the journal daily quest'}
        </p>
      </section>
    </div>
  );
}

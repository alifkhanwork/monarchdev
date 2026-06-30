'use client';

import { useEffect, useState } from 'react';

interface JournalPanelProps {
  journalEntry: string;
  onSave: (text: string) => void | Promise<void>;
  isFrozenDay?: boolean;
  viewDateLabel?: string;
  isToday?: boolean;
  isSaving?: boolean;
  questCompleted?: boolean;
}

export default function JournalPanel({
  journalEntry,
  onSave,
  isFrozenDay = false,
  viewDateLabel,
  isToday = true,
  isSaving = false,
  questCompleted = false,
}: JournalPanelProps) {
  const [draft, setDraft] = useState(journalEntry);
  const [isEditing, setIsEditing] = useState(() => !journalEntry.trim());
  const showingHistorical = viewDateLabel && !isToday;

  useEffect(() => {
    setDraft(journalEntry);
    setIsEditing(!journalEntry.trim());
  }, [journalEntry]);

  const charCount = draft.trim().length;
  const canSave = charCount >= 10;
  const isDirty = draft !== journalEntry;
  const hasSavedEntry = journalEntry.trim().length >= 10;

  const handleSave = async () => {
    if (!canSave) return;
    await onSave(draft);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(journalEntry);
    setIsEditing(false);
  };

  return (
    <div
      className={`glass-panel h-full flex flex-col ${
        showingHistorical ? 'min-h-[280px]' : 'min-h-[320px] lg:min-h-0'
      }`}
    >
      <div className="panel-header">
        <div>
          <span className="panel-label">End of Day Journal</span>
          <p className="text-[10px] text-slate-500 mt-1">
            {showingHistorical
              ? `Journal for ${viewDateLabel}`
              : isFrozenDay
                ? 'Optional on frozen days — save when ready'
                : 'Save to complete the journal daily quest'}
          </p>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wider ${
            questCompleted || hasSavedEntry
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
          }`}
        >
          {questCompleted ? 'Quest Done' : hasSavedEntry ? 'Saved' : 'Pending'}
        </span>
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        readOnly={!isEditing}
        placeholder={
          showingHistorical
            ? `Journal entry for ${viewDateLabel}...`
            : 'Reflect on today — wins, lessons, struggles, and tomorrow\'s focus...'
        }
        className={`journal-textarea flex-1 mt-3 ${
          showingHistorical ? 'min-h-[200px]' : 'min-h-[240px] lg:min-h-0'
        } ${!isEditing ? 'opacity-90 cursor-default' : ''}`}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
        <span className="text-[10px] text-slate-500">
          {questCompleted
            ? '✓ Journal quest completed'
            : canSave
              ? isDirty
                ? 'Unsaved changes'
                : '✓ Ready to save'
              : 'Minimum 10 characters required'}
          <span className="tabular-nums ml-2">{charCount} chars</span>
        </span>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              {hasSavedEntry && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="journal-action-btn journal-action-btn-muted"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave || isSaving || (!isDirty && hasSavedEntry)}
                className="journal-action-btn"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              disabled={isSaving}
              className="journal-action-btn journal-action-btn-muted"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

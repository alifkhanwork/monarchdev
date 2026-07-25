'use client';

import { useEffect, useRef, useState } from 'react';
import { getJournalPromptForDate } from '@/lib/journalPrompts';
import { getTodayKey } from '@/lib/journalStorage';
import { LIMITS } from '@/lib/inputValidation';

interface JournalPanelProps {
  journalEntry: string;
  onSave: (text: string) => void | Promise<void>;
  isFrozenDay?: boolean;
  viewDateLabel?: string;
  /** YYYY-MM-DD for prompt rotation when viewing a specific day */
  dateKey?: string;
  isToday?: boolean;
  isSaving?: boolean;
  questCompleted?: boolean;
  variant?: 'inline' | 'drawer';
  onClose?: () => void;
}

export default function JournalPanel({
  journalEntry,
  onSave,
  isFrozenDay = false,
  viewDateLabel,
  dateKey,
  isToday = true,
  isSaving = false,
  questCompleted = false,
  variant = 'inline',
  onClose,
}: JournalPanelProps) {
  const [draft, setDraft] = useState(journalEntry);
  const [isEditing, setIsEditing] = useState(() => !journalEntry.trim());
  const [expanded, setExpanded] = useState(() => Boolean(journalEntry.trim()) || variant === 'drawer');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const showingHistorical = viewDateLabel && !isToday;
  const isDrawer = variant === 'drawer';

  useEffect(() => {
    setDraft(journalEntry);
    setIsEditing(!journalEntry.trim());
    if (journalEntry.trim()) setExpanded(true);
  }, [journalEntry]);

  useEffect(() => {
    if (!isDrawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isDrawer, onClose]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el || !expanded) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 104), 360)}px`;
  }, [draft, expanded, isEditing]);

  const charCount = draft.trim().length;
  const canSave = charCount >= LIMITS.journalMinChars && charCount <= LIMITS.journalMaxChars;
  const isDirty = draft !== journalEntry;
  const hasSavedEntry = journalEntry.trim().length >= LIMITS.journalMinChars;
  const overMax = charCount > LIMITS.journalMaxChars;
  const prompt = getJournalPromptForDate(dateKey || getTodayKey());
  const journalPrompt = showingHistorical
    ? `Journal for ${viewDateLabel}: ${prompt}`
    : prompt;

  const handleSave = async () => {
    if (!canSave) return;
    await onSave(draft);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(journalEntry);
    setIsEditing(false);
  };

  const body = (
    <>
      <div className="panel-header">
        <div>
          <span className="panel-label">End of Day Journal</span>
          <p className="text-meta mt-0.5">
            {showingHistorical
              ? `Journal for ${viewDateLabel}`
              : isFrozenDay
                ? 'Optional on frozen days — save when ready'
                : 'Save to complete the journal daily quest'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wider ${
              questCompleted || hasSavedEntry
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
            }`}
          >
            {questCompleted ? 'Quest Done' : hasSavedEntry ? 'Saved' : 'Pending'}
          </span>
          {isDrawer && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="journal-action-btn journal-action-btn-muted !px-2"
              aria-label="Close journal"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {!expanded && !hasSavedEntry ? (
        <button
          type="button"
          onClick={() => {
            setExpanded(true);
            setIsEditing(true);
          }}
          className="mt-3 w-full rounded border border-dashed border-cyan-500/30 bg-slate-950/40 px-3 py-6 text-sm text-slate-400 hover:border-cyan-400/40 hover:text-cyan-200 transition-colors"
        >
          Write today&apos;s entry — {journalPrompt}
        </button>
      ) : (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, LIMITS.journalMaxChars + 50))}
          readOnly={!isEditing}
          maxLength={LIMITS.journalMaxChars + 50}
          placeholder={journalPrompt}
          className={`journal-textarea mt-2 ${!isEditing ? 'opacity-90 cursor-default' : ''}`}
          rows={4}
        />
      )}

      {expanded && (
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
          <span className="text-meta">
            {questCompleted
              ? '✓ Journal quest completed'
              : overMax
                ? `Too long — max ${LIMITS.journalMaxChars.toLocaleString()} characters`
                : canSave
                  ? isDirty
                    ? 'Unsaved changes'
                    : '✓ Ready to save'
                  : `Minimum ${LIMITS.journalMinChars} characters`}
            <span className={`font-mono-data ml-2 ${overMax ? 'text-amber-400' : ''}`}>
              {charCount}/{LIMITS.journalMaxChars}
            </span>
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
      )}
    </>
  );

  if (isDrawer) {
    return (
      <>
        <button
          type="button"
          className="journal-drawer-backdrop border-0 cursor-default"
          aria-label="Close journal drawer"
          onClick={onClose}
        />
        <aside
          className="journal-drawer custom-scrollbar overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          {body}
        </aside>
      </>
    );
  }

  return <div className="glass-panel flex flex-col">{body}</div>;
}

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

type JournalCategory = {
  key: string;
  label: string;
  placeholder: string;
};

const JOURNAL_CATEGORIES: JournalCategory[] = [
  { key: 'learn', label: 'What did you learn today?', placeholder: 'Concepts, tools, insights...' },
  { key: 'npm', label: 'What npm package did you make today?', placeholder: 'Package name, what it does...' },
  { key: 'workout', label: 'How was the workout for today?', placeholder: 'Energy, PRs, recovery notes...' },
  { key: 'feel', label: 'How do you feel so far?', placeholder: 'Mood, energy, focus...' },
];

const CATEGORY_HEADER = '## ';
const CATEGORY_DIVIDER = '\n\n';

function splitJournalEntry(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const category of JOURNAL_CATEGORIES) {
    result[category.key] = '';
  }

  if (!text.trim()) return result;

  const parts = text.split(CATEGORY_HEADER);
  const hasHeaders = parts.length > 1 && JOURNAL_CATEGORIES.some((c) =>
    parts.some((p) => p.startsWith(c.label))
  );

  if (!hasHeaders) {
    result.learn = text.trim();
    return result;
  }

  let currentKey: string | null = null;
  let buffer = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const matchedCategory = JOURNAL_CATEGORIES.find((c) =>
      part.startsWith(c.label)
    );

    if (matchedCategory) {
      if (currentKey && buffer.trim()) {
        result[currentKey] = buffer.trim();
      }
      currentKey = matchedCategory.key;
      buffer = part.slice(matchedCategory.label.length).trim();
    } else if (currentKey) {
      buffer = part;
    }
  }

  if (currentKey && buffer.trim()) {
    result[currentKey] = buffer.trim();
  }

  return result;
}

function combineJournalEntry(categories: Record<string, string>): string {
  return JOURNAL_CATEGORIES.map((c) => {
    const value = categories[c.key]?.trim() || '';
    if (!value) return '';
    return `${CATEGORY_HEADER}${c.label}${CATEGORY_DIVIDER}${value}`;
  }).filter(Boolean).join(CATEGORY_DIVIDER);
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
  const categories = useRef(splitJournalEntry(journalEntry));
  const [drafts, setDrafts] = useState<Record<string, string>>(categories.current);
  const [isEditing, setIsEditing] = useState(() => !journalEntry.trim());
  const [expanded, setExpanded] = useState(() => Boolean(journalEntry.trim()) || variant === 'drawer');
  const showingHistorical = viewDateLabel && !isToday;
  const isDrawer = variant === 'drawer';

  useEffect(() => {
    categories.current = splitJournalEntry(journalEntry);
    setDrafts(categories.current);
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

  const charCount = Object.values(drafts).reduce((sum, v) => sum + v.trim().length, 0);
  const canSave = charCount >= LIMITS.journalMinChars && charCount <= LIMITS.journalMaxChars;
  const isDirty = combineJournalEntry(drafts) !== journalEntry;
  const hasSavedEntry = journalEntry.trim().length >= LIMITS.journalMinChars;
  const overMax = charCount > LIMITS.journalMaxChars;
  const prompt = getJournalPromptForDate(dateKey || getTodayKey());
  const journalPrompt = showingHistorical
    ? `Journal for ${viewDateLabel}: ${prompt}`
    : prompt;

  const handleCategoryChange = (key: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!canSave) return;
    const combined = combineJournalEntry(drafts);
    await onSave(combined);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDrafts(categories.current);
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
        <div className="mt-2 space-y-2.5">
          {JOURNAL_CATEGORIES.map((category) => (
            <div key={category.key}>
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 block">
                {category.label}
              </label>
              <textarea
                value={drafts[category.key] || ''}
                onChange={(e) => handleCategoryChange(category.key, e.target.value)}
                readOnly={!isEditing}
                placeholder={category.placeholder}
                className={`journal-textarea ${!isEditing ? 'opacity-90 cursor-default' : ''}`}
                rows={2}
              />
            </div>
          ))}
        </div>
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

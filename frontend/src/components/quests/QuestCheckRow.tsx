'use client';

import type { ReactNode } from 'react';

interface QuestCheckRowProps {
  done: boolean;
  title: string;
  meta?: ReactNode;
  onToggle?: () => void;
  disabled?: boolean;
  trailing?: ReactNode;
  flashing?: boolean;
}

/** Shared compact checkbox row used by daily quests, rituals, and custom quests. */
export default function QuestCheckRow({
  done,
  title,
  meta,
  onToggle,
  disabled,
  trailing,
  flashing,
}: QuestCheckRowProps) {
  return (
    <div className={`quest-item w-full ${done ? 'quest-item-done' : ''} ${flashing ? 'quest-item-flash' : ''}`}>
      <button
        type="button"
        className="quest-hit -ml-1"
        onClick={onToggle}
        disabled={disabled || !onToggle}
        aria-pressed={done}
        aria-label={title}
      >
        <span className={`quest-checkbox ${done ? 'quest-checkbox-done' : ''}`}>{done && '✓'}</span>
      </button>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled || !onToggle}
        className="flex-1 min-w-0 text-left flex items-center gap-2"
      >
        <span
          className={`text-[13px] sm:text-sm truncate ${
            done ? 'line-through text-slate-500' : 'text-white'
          }`}
        >
          {title}
        </span>
        {meta && <span className="quest-meta-pill hidden sm:inline">{meta}</span>}
      </button>
      {meta && <span className="quest-meta-pill sm:hidden">{meta}</span>}
      {trailing}
    </div>
  );
}

'use client';

import type { GrindQuest } from '@/types';

interface GrindQuestCardProps {
  quest: GrindQuest;
  onIncrement: (id: string, delta: number) => void;
  updating?: boolean;
}

function formatProgress(value: number, trackingSource?: GrindQuest['trackingSource']) {
  if (trackingSource === 'study_hours') {
    const rounded = Math.round(value * 100) / 100;
    return String(rounded);
  }
  return String(Math.round(value));
}

export default function GrindQuestCard({ quest, onIncrement, updating }: GrindQuestCardProps) {
  const delta = quest.targetCount > 20 ? Math.max(1, Math.floor(quest.targetCount / 20)) : 1;
  const autoTracked = Boolean(quest.autoTracked);

  return (
    <article className="milestone-quest-card h-full flex flex-col !p-2.5">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <span className="text-[9px] uppercase tracking-wider text-cyan-400/60">{quest.category}</span>
          <h3 className="text-[13px] font-semibold text-white leading-snug truncate">{quest.title}</h3>
        </div>
        <span className="text-[11px] text-neon-teal font-bold font-mono-data shrink-0">
          {formatProgress(quest.currentProgress, quest.trackingSource)}/{quest.targetCount}
        </span>
      </div>

      <div className="mt-auto space-y-1.5">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${quest.progressPercent}%` }} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-500 font-mono-data">{quest.progressPercent}%</span>
          {autoTracked ? (
            <span className="text-[9px] uppercase tracking-wider text-cyan-400/70">
              auto-tracked from Daily Grind
            </span>
          ) : (
            <div className="flex gap-1">
              <button
                type="button"
                disabled={updating || quest.currentProgress <= 0}
                onClick={() => onIncrement(quest._id, -delta)}
                className="grind-btn grind-btn-minus"
              >
                −{delta}
              </button>
              <button
                type="button"
                disabled={updating || quest.currentProgress >= quest.targetCount}
                onClick={() => onIncrement(quest._id, delta)}
                className="grind-btn grind-btn-plus"
              >
                +{delta}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

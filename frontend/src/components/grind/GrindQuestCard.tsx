'use client';

import type { GrindQuest } from '@/types';

interface GrindQuestCardProps {
  quest: GrindQuest;
  onIncrement: (id: string, delta: number) => void;
  updating?: boolean;
}

export default function GrindQuestCard({ quest, onIncrement, updating }: GrindQuestCardProps) {
  const delta = quest.targetCount > 20 ? Math.max(1, Math.floor(quest.targetCount / 20)) : 1;

  return (
    <article className="milestone-quest-card">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <span className="text-[9px] uppercase tracking-wider text-cyan-400/60">
            {quest.category}
          </span>
          <h3 className="text-sm font-semibold text-white mt-1 leading-snug">{quest.title}</h3>
        </div>
        <span className="text-xs text-cyan-300 font-bold tabular-nums shrink-0">
          {quest.currentProgress}/{quest.targetCount}
        </span>
      </div>

      <div className="space-y-2">
        <div className="h-2 rounded-full bg-slate-900/80 border border-cyan-500/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-700 to-cyan-400 transition-all duration-500"
            style={{ width: `${quest.progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 tabular-nums">{quest.progressPercent}%</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={updating || quest.currentProgress <= 0}
              onClick={() => onIncrement(quest._id, -delta)}
              className="grind-btn grind-btn-minus"
            >
              -{delta}
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
        </div>
      </div>
    </article>
  );
}

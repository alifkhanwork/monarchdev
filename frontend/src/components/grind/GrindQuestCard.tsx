'use client';

import type { GrindQuest } from '@/types';

interface GrindQuestCardProps {
  quest: GrindQuest;
  onIncrement: (id: string, delta: number) => void;
  updating?: boolean;
}

const CATEGORY_STYLES: Record<string, string> = {
  fitness: 'text-amber-300/80',
  health: 'text-rose-300/80',
  knowledge: 'text-cyan-300/80',
  professional: 'text-violet-300/80',
  elite: 'text-glow-gold',
};

function formatProgress(value: number, quest: GrindQuest) {
  const src = quest.trackingSource;
  if (src === 'study_hours' && quest.unit === 'min') {
    return String(Math.round(value * 60));
  }
  if (src === 'study_hours' || src === 'water') {
    const rounded = Math.round(value * 100) / 100;
    return String(rounded);
  }
  if (src === 'steps' || quest.targetCount >= 1000) {
    return Math.round(value).toLocaleString();
  }
  return String(Math.round(value * 100) / 100);
}

function formatTarget(quest: GrindQuest) {
  if (quest.trackingSource === 'steps' || quest.targetCount >= 1000) {
    return quest.targetCount.toLocaleString();
  }
  if (quest.unit === 'min') {
    return String(Math.round(quest.targetCount * 60));
  }
  return String(quest.targetCount);
}

export default function GrindQuestCard({ quest, onIncrement, updating }: GrindQuestCardProps) {
  const delta =
    quest.targetCount > 20 ? Math.max(1, Math.floor(quest.targetCount / 20)) : 1;
  const autoTracked = Boolean(quest.autoTracked);
  const colorClass = CATEGORY_STYLES[quest.categoryColor || ''] || 'text-cyan-400/60';
  const elite = Boolean(quest.isElite);

  return (
    <article
      className={`milestone-quest-card h-full flex flex-col !p-2.5 ${
        elite
          ? '!border-amber-400/50 shadow-[0_0_24px_rgba(251,191,36,0.18)] bg-gradient-to-br from-amber-500/10 via-slate-950/40 to-cyan-500/10'
          : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <span className={`text-[9px] uppercase tracking-wider ${colorClass}`}>
            {quest.categoryIcon ? `${quest.categoryIcon} ` : ''}
            {quest.category}
          </span>
          <h3 className="text-[13px] font-semibold text-white leading-snug">{quest.title}</h3>
          {quest.description && (
            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
              {quest.description}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="text-[11px] text-neon-teal font-bold font-mono-data block">
            {formatProgress(quest.currentProgress, quest)}/{formatTarget(quest)}
            {quest.unit ? (
              <span className="text-[9px] text-slate-500 font-normal ml-0.5">{quest.unit}</span>
            ) : null}
          </span>
          {!!quest.expReward && (
            <span className="text-[10px] text-amber-300/90 font-mono-data">
              +{quest.expReward.toLocaleString()} EXP
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto space-y-1.5">
        <div className="progress-track">
          <div
            className={`progress-fill ${elite ? '!bg-gradient-to-r !from-amber-400 !to-cyan-400' : ''}`}
            style={{ width: `${quest.progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-500 font-mono-data">
            {quest.progressPercent}%
            {quest.rewardClaimed ? ' · Cleared' : ''}
          </span>
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
                aria-label={`Decrease ${quest.title} by ${delta}`}
              >
                −{delta}
              </button>
              <button
                type="button"
                disabled={updating || quest.currentProgress >= quest.targetCount}
                onClick={() => onIncrement(quest._id, delta)}
                className="grind-btn grind-btn-plus"
                aria-label={`Increase ${quest.title} by ${delta}`}
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

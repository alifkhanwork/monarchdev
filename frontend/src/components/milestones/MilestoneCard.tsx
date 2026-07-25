'use client';

import { useState } from 'react';
import type { Milestone } from '@/types';
import {
  isMilestoneOverdue,
  questRankFromExp,
  QUEST_RANK_STYLES,
} from '@/lib/questBoardHelpers';

interface MilestoneCardProps {
  milestone: Milestone;
  onToggleSubtask: (milestoneId: string, subtaskId: string) => void;
  compact?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  'Level 20 Main Quest': 'S-Rank Gate',
  'SSR Gear Quest': 'SSR Gear Quest',
};

function formatTargetDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MilestoneCard({
  milestone,
  onToggleSubtask,
  compact = true,
}: MilestoneCardProps) {
  const [expanded, setExpanded] = useState(!compact);
  const progress = milestone.progressPercent;
  const isSSR = milestone.category === 'SSR Gear Quest' || milestone.rewardItem?.rarity === 'SSR';
  const target = formatTargetDate(milestone.targetDate);
  const overdue = isMilestoneOverdue(milestone.targetDate, milestone.isCompleted);
  const hasSubtasks = milestone.subTasks.length > 0;
  const rank = questRankFromExp(milestone.expReward, isSSR);

  const rewardParts: string[] = [];
  if (milestone.expReward > 0) rewardParts.push(`+${milestone.expReward} EXP`);
  if (milestone.rewardStat && milestone.rewardStatAmount > 0) {
    rewardParts.push(`+${milestone.rewardStatAmount} ${milestone.rewardStat.toUpperCase()}`);
  }

  return (
    <article
      className={`milestone-quest-card ${milestone.isCompleted ? 'milestone-quest-done' : ''} ${
        isSSR ? 'milestone-quest-ssr' : ''
      } ${overdue ? 'milestone-quest-overdue' : ''}`}
    >
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span
                className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono-data ${QUEST_RANK_STYLES[rank]}`}
                title={`Rank ${rank}`}
              >
                {rank}
              </span>
              <h3
                className={`text-[13px] font-semibold truncate ${
                  milestone.isCompleted ? 'text-slate-500 line-through' : 'text-white'
                }`}
              >
                {milestone.title}
              </h3>
              {target && (
                <span
                  className={`shrink-0 text-[11px] font-mono-data ${
                    overdue ? 'text-red-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {target}
                </span>
              )}
              {overdue && (
                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-red-500/50 bg-red-950/50 text-red-300">
                  Overdue
                </span>
              )}
              {rewardParts.length > 0 && (
                <span className="text-[11px] text-amber-400/90 font-mono-data shrink-0">
                  {rewardParts.join(' · ')}
                </span>
              )}
              {milestone.rewardItem && (
                <span
                  className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    milestone.rewardItem.rarity === 'SSR'
                      ? 'border-amber-500/50 bg-amber-900/30 text-amber-300'
                      : 'border-purple-500/50 bg-purple-900/30 text-purple-300'
                  }`}
                >
                  {milestone.rewardItem.rarity}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="progress-track flex-1 !h-1">
                <div
                  className={`progress-fill ${
                    milestone.isCompleted
                      ? '!bg-gradient-to-r !from-emerald-600 !to-emerald-400'
                      : overdue
                        ? '!bg-gradient-to-r !from-red-700 !to-red-400'
                        : ''
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span
                className={`text-[10px] font-mono-data shrink-0 ${
                  milestone.isCompleted
                    ? 'text-emerald-400'
                    : overdue
                      ? 'text-red-400'
                      : 'text-cyan-400'
                }`}
              >
                {milestone.isCompleted ? 'Done' : `${progress}%`}
              </span>
            </div>
          </div>
          {(hasSubtasks || !compact) && (
            <span className="text-cyan-400/60 text-[10px] shrink-0">{expanded ? '▼' : '▶'}</span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-cyan-500/10 space-y-1.5">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">
            {CATEGORY_LABELS[milestone.category] ?? milestone.category}
            {milestone.rewardItem ? ` · ${milestone.rewardItem.name}` : ''}
          </p>
          {hasSubtasks && (
            <ul className="space-y-1">
              {milestone.subTasks.map((st) => (
                <li key={st._id}>
                  <label className="flex items-center gap-2 cursor-pointer text-[13px] min-h-[36px]">
                    <span className="quest-hit">
                      <input
                        type="checkbox"
                        checked={st.isCompleted}
                        onChange={() => onToggleSubtask(milestone._id, st._id)}
                        className="quest-native-checkbox"
                      />
                    </span>
                    <span className={st.isCompleted ? 'text-slate-500 line-through' : 'text-slate-300'}>
                      {st.title}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}

'use client';

import { useState } from 'react';
import type { Milestone } from '@/types';

interface MilestoneCardProps {
  milestone: Milestone;
  onToggleSubtask: (milestoneId: string, subtaskId: string) => void;
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

export default function MilestoneCard({ milestone, onToggleSubtask }: MilestoneCardProps) {
  const [expanded, setExpanded] = useState(false);
  const progress = milestone.progressPercent;
  const isSSR = milestone.category === 'SSR Gear Quest' || milestone.rewardItem?.rarity === 'SSR';
  const target = formatTargetDate(milestone.targetDate);
  const hasSubtasks = milestone.subTasks.length > 0;

  const rewardParts: string[] = [];
  if (milestone.expReward > 0) rewardParts.push(`+${milestone.expReward} EXP`);
  if (milestone.rewardStat && milestone.rewardStatAmount > 0) {
    rewardParts.push(`+${milestone.rewardStatAmount} ${milestone.rewardStat.toUpperCase()}`);
  }

  return (
    <article
      className={`milestone-quest-card ${milestone.isCompleted ? 'milestone-quest-done' : ''} ${
        isSSR ? 'milestone-quest-ssr' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        {hasSubtasks && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-cyan-400/70 hover:text-cyan-300 mt-0.5 shrink-0 w-5"
            aria-expanded={expanded}
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="min-w-0">
              <span className="text-[9px] uppercase tracking-wider text-cyan-400/60">
                {CATEGORY_LABELS[milestone.category] ?? milestone.category}
              </span>
              <h3
                className={`text-sm sm:text-base font-semibold mt-1 leading-snug ${
                  milestone.isCompleted ? 'text-slate-500 line-through' : 'text-white'
                }`}
              >
                {milestone.title}
              </h3>
            </div>
            {milestone.rewardItem ? (
              <span
                className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border ${
                  milestone.rewardItem.rarity === 'SSR'
                    ? 'border-amber-500/50 bg-amber-900/30 text-amber-300'
                    : 'border-purple-500/50 bg-purple-900/30 text-purple-300'
                }`}
              >
                {milestone.rewardItem.rarity}
              </span>
            ) : null}
          </div>

          {target && (
            <p className="text-[10px] text-slate-500 mb-2">
              Target: <span className="text-slate-400">{target}</span>
            </p>
          )}

          {rewardParts.length > 0 && (
            <p className="text-[10px] text-slate-500 mb-2">
              Reward:{' '}
              <span className="text-amber-400/90 font-semibold">{rewardParts.join(', ')}</span>
            </p>
          )}

          {milestone.rewardItem && (
            <p className="text-[10px] text-slate-500 mb-2">
              Item: <span className="text-slate-400">{milestone.rewardItem.name}</span>
            </p>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500 uppercase tracking-wider">Progress</span>
              <span
                className={`font-semibold ${
                  milestone.isCompleted ? 'text-emerald-400' : 'text-cyan-400'
                }`}
              >
                {milestone.isCompleted ? 'Complete' : `${progress}%`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-900/80 border border-cyan-500/15 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  milestone.isCompleted
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                    : 'bg-gradient-to-r from-cyan-700 to-cyan-400'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {expanded && hasSubtasks && (
            <ul className="mt-3 space-y-1.5 border-t border-cyan-500/10 pt-3">
              {milestone.subTasks.map((st) => (
                <li key={st._id}>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={st.isCompleted}
                      onChange={() => onToggleSubtask(milestone._id, st._id)}
                      className="quest-native-checkbox"
                    />
                    <span className={st.isCompleted ? 'text-slate-500 line-through' : 'text-slate-300'}>
                      {st.title}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}

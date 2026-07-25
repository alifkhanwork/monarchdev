'use client';

import { useMemo, useState } from 'react';
import type { DailyTask } from '@/types';
import {
  loadPinnedQuestId,
  savePinnedQuestId,
} from '@/lib/priorityQuestStorage';

interface TodayPriorityCardProps {
  tasks: DailyTask[];
  onToggleTask: (taskId: string, isCompleted: boolean) => void;
  completingId: string | null;
}

export default function TodayPriorityCard({
  tasks,
  onToggleTask,
  completingId,
}: TodayPriorityCardProps) {
  const [pinnedId, setPinnedId] = useState<string | null>(() => loadPinnedQuestId());

  const incomplete = useMemo(() => tasks.filter((t) => !t.isCompleted), [tasks]);

  const priority = useMemo(() => {
    if (pinnedId) {
      const pinned = incomplete.find((t) => t._id === pinnedId);
      if (pinned) return pinned;
    }
    if (incomplete.length === 0) return null;
    return [...incomplete].sort((a, b) => b.expReward - a.expReward)[0];
  }, [incomplete, pinnedId]);

  const pin = (id: string) => {
    const next = pinnedId === id ? null : id;
    setPinnedId(next);
    savePinnedQuestId(next);
  };

  if (!priority) {
    return (
      <section className="glass-panel !py-2.5 border-emerald-500/25">
        <p className="panel-label">Today&apos;s Priority</p>
        <p className="text-sm text-emerald-300/90 mt-1">All quests cleared — rest easy, Hunter.</p>
      </section>
    );
  }

  const isPinned = pinnedId === priority._id;
  const busy = completingId === priority._id;

  return (
    <section className="glass-panel !py-2.5 border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-transparent">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="panel-label">Today&apos;s Priority</p>
          <p className="text-[15px] font-semibold text-white mt-1 truncate">{priority.taskName}</p>
          <p className="text-meta mt-0.5">
            +{priority.expReward} EXP · {priority.category}
            {isPinned ? ' · Pinned' : ' · Highest EXP open'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            className="journal-action-btn !min-h-[36px]"
            onClick={() => pin(priority._id)}
            aria-pressed={isPinned}
          >
            {isPinned ? 'Unpin' : 'Pin'}
          </button>
          <button
            type="button"
            className="journal-action-btn !min-h-[36px] !border-cyan-500/40 !text-cyan-300"
            disabled={busy}
            onClick={() => onToggleTask(priority._id, false)}
          >
            {busy ? '…' : 'Clear'}
          </button>
        </div>
      </div>
    </section>
  );
}

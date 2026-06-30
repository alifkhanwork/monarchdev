'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatResetCountdown } from '@/lib/grindUtils';
import type { GrindResponse } from '@/types';
import GrindQuestCard from '@/components/grind/GrindQuestCard';

interface GrindPanelProps {
  title: string;
  description: string;
  fetchGrind: () => Promise<GrindResponse>;
  updateProgress: (id: string, delta: number) => Promise<{ _id: string; currentProgress: number; progressPercent: number }>;
}

export default function GrindPanel({ title, description, fetchGrind, updateProgress }: GrindPanelProps) {
  const [data, setData] = useState<GrindResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetchGrind();
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [fetchGrind]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!data) return;
    const tick = () => setCountdown(formatResetCountdown(data.resetsInMs));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [data]);

  const handleIncrement = async (id: string, delta: number) => {
    setUpdatingId(id);
    try {
      const result = await updateProgress(id, delta);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          quests: prev.quests.map((q) =>
            q._id === id
              ? {
                  ...q,
                  currentProgress: result.currentProgress,
                  progressPercent: result.progressPercent,
                }
              : q
          ),
        };
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update progress');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="tab-content flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cleared = data?.quests.filter((q) => q.progressPercent >= 100).length ?? 0;

  return (
    <div className="tab-content space-y-4">
      <div className="glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="panel-label">{title}</p>
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-4 text-sm shrink-0">
          <span className="text-[10px] px-2 py-1 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 uppercase tracking-wider">
            Resets in: {countdown}
          </span>
          <span className="text-slate-500">
            Cleared{' '}
            <span className="text-cyan-300 font-bold tabular-nums">
              {cleared}/{data?.quests.length ?? 0}
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data?.quests.map((q) => (
          <GrindQuestCard
            key={q._id}
            quest={q}
            onIncrement={handleIncrement}
            updating={updatingId === q._id}
          />
        ))}
      </div>
    </div>
  );
}

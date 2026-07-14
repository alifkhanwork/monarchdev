'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatResetCountdown } from '@/lib/grindUtils';
import type { GrindResponse } from '@/types';
import type { GrindPeriod } from '@/types/tabs';
import { loadGrindPeriod, saveGrindPeriod } from '@/types/tabs';
import GrindQuestCard from '@/components/grind/GrindQuestCard';

export default function GrindHubTab() {
  const [period, setPeriod] = useState<GrindPeriod>('weekly');
  const [data, setData] = useState<GrindResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    setPeriod(loadGrindPeriod());
  }, []);

  const selectPeriod = (next: GrindPeriod) => {
    setPeriod(next);
    saveGrindPeriod(next);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = period === 'weekly' ? await api.getWeeklyGrind() : await api.getMonthlyGrind();
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [period]);

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
      const result =
        period === 'weekly'
          ? await api.updateWeeklyProgress(id, delta)
          : await api.updateMonthlyProgress(id, delta);
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

  const cleared = data?.quests.filter((q) => q.progressPercent >= 100).length ?? 0;

  return (
    <div className="tab-content space-y-2.5">
      <div className="glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-2 !py-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded border border-cyan-500/25 p-0.5 bg-slate-950/50">
            {(['weekly', 'monthly'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => selectPeriod(p)}
                className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all min-h-[36px] ${
                  period === p
                    ? 'bg-cyan-500/20 text-neon-teal'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {p === 'weekly' ? 'Weekly' : 'Monthly'}
              </button>
            ))}
          </div>
          <p className="text-meta">
            {period === 'weekly' ? 'Resets every Monday' : 'Resets on the 1st'}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] shrink-0">
          <span className="font-mono-data text-cyan-300/90 px-2 py-1 rounded border border-cyan-500/25 bg-cyan-500/10">
            {countdown || '…'}
          </span>
          <span className="text-slate-500">
            Cleared{' '}
            <span className="text-neon-teal font-bold font-mono-data">
              {cleared}/{data?.quests.length ?? 0}
            </span>
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {data?.quests.map((q) => (
            <GrindQuestCard
              key={q._id}
              quest={q}
              onIncrement={handleIncrement}
              updating={updatingId === q._id}
            />
          ))}
          {!data?.quests.length && (
            <div className="glass-panel col-span-full text-center py-8">
              <p className="text-sm text-slate-400">
                No {period} grind quests yet — seed the board and claim your first clear.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

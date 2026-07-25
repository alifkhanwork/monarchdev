'use client';

import { useMemo } from 'react';
import type { User } from '@/types';
import { deriveInsights } from '@/lib/insights';

interface InsightsSectionProps {
  user: User;
}

export default function InsightsSection({ user }: InsightsSectionProps) {
  const cards = useMemo(() => deriveInsights(user), [user]);

  if (cards.length === 0) {
    return (
      <section className="glass-panel !py-3">
        <p className="panel-label mb-1">Insights</p>
        <p className="text-meta">
          Keep clearing dailies — trends appear after a few days of history.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 px-0.5">
        <p className="panel-label">Insights</p>
        <p className="text-meta">From your existing clear log &amp; stat history</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {cards.map((c) => (
          <div key={c.id} className="lifetime-stat-card !py-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">{c.label}</p>
            <p className="text-lg font-bold font-mono-data text-neon-teal leading-tight">{c.value}</p>
            <p className="text-[11px] text-slate-400 leading-snug">{c.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

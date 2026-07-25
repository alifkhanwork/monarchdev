'use client';

import type { ReactNode } from 'react';

/** Shared pulsing placeholder block. */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-800/70 border border-slate-700/40 ${className}`}
      aria-hidden
    />
  );
}

/** Glass-panel shell with stacked skeleton rows. */
export function PanelSkeleton({
  rows = 3,
  className = '',
  header = true,
}: {
  rows?: number;
  className?: string;
  header?: boolean;
}) {
  return (
    <div className={`glass-panel space-y-2.5 ${className}`} aria-busy="true" aria-label="Loading">
      {header && <Skeleton className="h-3 w-28" />}
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={`h-8 w-full ${i === rows - 1 ? 'opacity-60' : ''}`} />
      ))}
    </div>
  );
}

/** Compact stat-card grid skeleton (e.g. training / insights). */
export function StatCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="lifetime-stat-card space-y-2 !py-3">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-2 w-full opacity-50" />
        </div>
      ))}
    </div>
  );
}

/** Heatmap-ish block for streak calendar loading. */
export function HeatmapSkeleton() {
  return (
    <div className="glass-panel !py-2.5 !px-3 space-y-2" aria-busy="true" aria-label="Loading heatmap">
      <Skeleton className="h-3 w-32" />
      <div className="flex gap-[3px] overflow-hidden">
        {Array.from({ length: 10 }).map((_, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }).map((_, di) => (
              <Skeleton key={di} className="heatmap-cell !rounded-[2px]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardBootSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-5 py-3 sm:py-4 space-y-2.5" aria-busy="true">
      <Skeleton className="h-12 w-full" />
      <PanelSkeleton rows={4} />
      <PanelSkeleton rows={5} />
      <StatCardsSkeleton count={3} />
    </div>
  );
}

export function SkeletonBlock({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

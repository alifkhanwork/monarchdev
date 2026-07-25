'use client';

import { useEffect } from 'react';

interface LevelUpToastProps {
  levels: number[];
  onDismiss: () => void;
}

export default function LevelUpToast({ levels, onDismiss }: LevelUpToastProps) {
  useEffect(() => {
    if (levels.length === 0) return;
    const timer = setTimeout(onDismiss, 3200);
    return () => clearTimeout(timer);
  }, [levels, onDismiss]);

  if (levels.length === 0) return null;

  const reached = levels[levels.length - 1];
  const multi = levels.length > 1;

  return (
    <>
      <div className="level-up-flash fixed inset-0 z-[60] pointer-events-none" aria-hidden />
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="level-up-title"
      >
        <button
          type="button"
          className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
          aria-label="Dismiss level up"
          onClick={onDismiss}
        />
        <div className="level-up-banner relative text-center px-8 py-8 animate-level-up min-w-[260px] max-w-sm border border-cyan-400/35 shadow-[0_0_40px_rgba(0,229,255,0.25)]">
          <p className="text-cyan-400 text-[11px] uppercase tracking-[0.4em] mb-2">System Alert</p>
          <h2 id="level-up-title" className="text-4xl sm:text-5xl font-bold text-glow-cyan mb-1">
            LEVEL UP
          </h2>
          <p className="text-amber-300 text-2xl font-bold font-mono-data mt-2">Level {reached}</p>
          {multi && (
            <p className="text-[12px] text-cyan-300/80 font-mono-data mt-1">
              +{levels.length} levels this clear
            </p>
          )}
          <p className="text-meta mt-3">The System recognizes your growth, Hunter.</p>
          <button type="button" className="journal-action-btn mt-4 pointer-events-auto" onClick={onDismiss}>
            Continue
          </button>
        </div>
      </div>
    </>
  );
}

'use client';

import { useEffect } from 'react';

interface LevelUpToastProps {
  levels: number[];
  onDismiss: () => void;
}

export default function LevelUpToast({ levels, onDismiss }: LevelUpToastProps) {
  useEffect(() => {
    if (levels.length === 0) return;
    const timer = setTimeout(onDismiss, 1500);
    return () => clearTimeout(timer);
  }, [levels, onDismiss]);

  if (levels.length === 0) return null;

  return (
    <>
      <div className="level-up-flash fixed inset-0 z-[60] pointer-events-none" />
      <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
        <div className="level-up-banner text-center px-8 py-6 animate-level-up">
          <p className="text-cyan-400 text-xs uppercase tracking-[0.4em] mb-2">System Alert</p>
          <h2 className="text-4xl font-bold text-glow-cyan mb-1">LEVEL UP!</h2>
          <p className="text-amber-300 text-2xl font-bold tabular-nums">
            Level {levels[levels.length - 1]}
          </p>
        </div>
      </div>
    </>
  );
}

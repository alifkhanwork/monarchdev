'use client';

import type { PenaltyInfo } from '@/types';

interface PenaltyBannerProps {
  penalty: PenaltyInfo;
  onDismiss: () => void;
}

export default function PenaltyBanner({ penalty, onDismiss }: PenaltyBannerProps) {
  return (
    <div className="penalty-banner flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-red-500/40 bg-red-950/40 backdrop-blur-md animate-fade-in">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-red-400 font-bold mb-1">
          [ Penalty Zone ]
        </p>
        <p className="text-sm text-red-200">
          You failed to complete{' '}
          <span className="font-bold text-white">{penalty.incompleteCount}</span> tasks.{' '}
          <span className="text-red-400 font-semibold">-{penalty.expLost} EXP</span>
        </p>
      </div>
      <button type="button" onClick={onDismiss} className="penalty-dismiss-btn shrink-0">
        Dismiss
      </button>
    </div>
  );
}

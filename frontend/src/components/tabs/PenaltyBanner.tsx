'use client';

import type { PenaltyInfo } from '@/types';

interface PenaltyBannerProps {
  penalty: PenaltyInfo;
  onDismiss: () => void;
}

export default function PenaltyBanner({ penalty, onDismiss }: PenaltyBannerProps) {
  return (
    <div
      role="alert"
      className="penalty-toast rounded-xl border border-red-500/45 bg-red-950/90 backdrop-blur-md p-3 sm:p-3.5 animate-fade-in"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em] text-red-400 font-bold mb-1">
            [ Penalty Zone ]
          </p>
          <p className="text-sm text-red-100/90 leading-snug">
            Failed{' '}
            <span className="font-bold text-white font-mono-data">{penalty.incompleteCount}</span>{' '}
            tasks.{' '}
            <span className="text-red-400 font-semibold font-mono-data">-{penalty.expLost} EXP</span>
          </p>
        </div>
        <button type="button" onClick={onDismiss} className="penalty-dismiss-btn shrink-0">
          Dismiss
        </button>
      </div>
    </div>
  );
}

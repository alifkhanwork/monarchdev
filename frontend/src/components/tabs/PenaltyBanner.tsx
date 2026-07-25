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
            {penalty.rankDownWarning ? '[ Rank Down Warning ]' : '[ Penalty Zone ]'}
          </p>
          <p className="text-sm text-red-100/90 leading-snug">
            Failed{' '}
            <span className="font-bold text-white font-mono-data">{penalty.incompleteCount}</span>{' '}
            tasks.{' '}
            <span className="text-red-400 font-semibold font-mono-data">-{penalty.expLost} EXP</span>
            {(penalty.vitalityLost ?? 0) > 0 && (
              <>
                {' '}
                ·{' '}
                <span className="text-orange-300 font-semibold font-mono-data">
                  -{penalty.vitalityLost} VIT
                </span>
              </>
            )}
          </p>
          {penalty.rankDownWarning && (
            <p className="text-[11px] text-red-300/80 mt-1">
              Incomplete day — streak reset. Frozen days never trigger this penalty.
            </p>
          )}
        </div>
        <button type="button" onClick={onDismiss} className="penalty-dismiss-btn shrink-0">
          Dismiss
        </button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

interface RestTimerProps {
  initialSeconds?: number;
  onDismiss: () => void;
}

export default function RestTimer({ initialSeconds = 90, onDismiss }: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setTimeLeft(initialSeconds);
    setIsActive(true);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) {
      if (timeLeft === 0) {
        // Play Web Audio chime sound
        try {
          const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } catch {
          // ignore audio context restrictions
        }
        const timeout = setTimeout(() => {
          onDismiss();
        }, 1200);
        return () => clearTimeout(timeout);
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft, onDismiss]);

  const addTime = (secs: number) => {
    setTimeLeft((prev) => Math.max(0, prev + secs));
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const isDone = timeLeft === 0;

  return (
    <div className="fixed bottom-16 right-3 sm:bottom-6 sm:right-6 z-50 animate-modal-scale">
      <div
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md transition-colors ${
          isDone
            ? 'border-emerald-400/60 bg-emerald-950/90 text-emerald-300 animate-pulse'
            : 'border-cyan-500/40 bg-slate-950/90 text-white'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg animate-spin-slow">⏱</span>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {isDone ? 'Rest Complete!' : 'Rest Timer'}
            </p>
            <p className="text-base sm:text-lg font-bold font-mono-data text-neon-teal leading-none mt-0.5">
              {timeStr}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => addTime(-15)}
            disabled={isDone}
            className="workout-bulk-btn workout-bulk-btn-muted !px-2 !py-1 text-[10px]"
            title="Subtract 15s"
          >
            -15s
          </button>
          <button
            type="button"
            onClick={() => addTime(15)}
            disabled={isDone}
            className="workout-bulk-btn !px-2 !py-1 text-[10px]"
            title="Add 15s"
          >
            +15s
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="workout-bulk-btn workout-bulk-btn-muted !px-2 !py-1 text-[10px] ml-1"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

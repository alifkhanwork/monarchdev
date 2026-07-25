'use client';

import { useState } from 'react';
import {
  ONBOARDING_STEPS,
  markOnboardingSeen,
} from '@/lib/onboardingStorage';

interface OnboardingModalProps {
  onDone: () => void;
}

export default function OnboardingModal({ onDone }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const total = ONBOARDING_STEPS.length;
  const current = ONBOARDING_STEPS[step];

  const finish = () => {
    markOnboardingSeen();
    onDone();
  };

  const next = () => {
    if (step >= total - 1) finish();
    else setStep((s) => s + 1);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
        aria-label="Skip onboarding"
        onClick={finish}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="relative w-full max-w-md glass-panel !p-5 border border-cyan-500/35 shadow-[0_0_40px_rgba(0,229,255,0.18)] animate-fade-in"
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-400/80 font-bold mb-2">
          System Briefing · {step + 1}/{total}
        </p>
        <h2 id="onboarding-title" className="text-xl font-bold text-glow-cyan mb-2">
          {current.title}
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">{current.body}</p>

        <div className="flex gap-1.5 mt-5 mb-4" aria-hidden>
          {ONBOARDING_STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i <= step ? 'bg-cyan-400/80' : 'bg-slate-700/80'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <button type="button" className="journal-action-btn journal-action-btn-muted" onClick={finish}>
            Skip
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                className="journal-action-btn journal-action-btn-muted"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </button>
            )}
            <button type="button" className="journal-action-btn" onClick={next}>
              {step >= total - 1 ? 'Enter The System' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

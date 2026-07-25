'use client';

interface CoachCard {
  exerciseName: string;
  verdict: string;
  recommendation: string;
  nextWeight?: number | null;
}

interface CoachFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  coach: {
    rating: number;
    headline: string;
    notes: string[];
    tips?: string[];
    cards: CoachCard[];
  } | null;
  trainingWeek?: number;
  beginnerPhase?: boolean;
}

const VERDICT_LABEL: Record<string, string> = {
  progress: 'Ready to Progress',
  maintain: 'Maintain',
  practice: 'Need More Practice',
  plateau: 'Plateau Watch',
  skip: 'Logged',
};

const VERDICT_COLOR: Record<string, string> = {
  progress: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  maintain: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
  practice: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
  plateau: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
  skip: 'text-slate-400 border-slate-500/30 bg-slate-500/10',
};

export default function CoachFeedbackModal({
  open,
  onClose,
  coach,
  trainingWeek,
  beginnerPhase,
}: CoachFeedbackModalProps) {
  if (!open || !coach) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center p-3">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto glass-panel !p-3 space-y-3 border border-cyan-500/30">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-neon-teal/80">Workout Complete</p>
          <h3 className="text-lg font-bold text-white mt-0.5">Coach Feedback</h3>
          <p className="text-amber-300/90 text-sm font-semibold mt-1">{coach.headline}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Performance Rating{' '}
            <span className="text-glow-gold font-mono-data">
              {'★'.repeat(coach.rating)}
              {'☆'.repeat(Math.max(0, 5 - coach.rating))}
            </span>
            {trainingWeek != null && (
              <span className="ml-2">
                · Week {trainingWeek}
                {beginnerPhase ? ' (Form Phase)' : ''}
              </span>
            )}
          </p>
        </div>

        <ul className="space-y-2">
          {coach.cards
            .filter((c) => c.verdict !== 'skip')
            .map((card) => (
              <li
                key={card.exerciseName}
                className={`rounded border px-2.5 py-2 ${VERDICT_COLOR[card.verdict] || VERDICT_COLOR.maintain}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold truncate">{card.exerciseName}</p>
                  <span className="text-[9px] uppercase tracking-wider shrink-0">
                    {VERDICT_LABEL[card.verdict] || card.verdict}
                  </span>
                </div>
                <p className="text-[11px] mt-1 opacity-90">{card.recommendation}</p>
                {card.nextWeight != null && card.verdict === 'progress' && (
                  <p className="text-[11px] font-mono-data mt-1">Next load → {card.nextWeight} kg</p>
                )}
              </li>
            ))}
        </ul>

        {!!coach.tips?.length && (
          <div className="rounded border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Suggestions</p>
            <ul className="space-y-1">
              {coach.tips.map((tip) => (
                <li key={tip} className="text-[11px] text-slate-300">
                  • {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button type="button" className="w-full workout-bulk-btn !py-2.5" onClick={onClose}>
          Return to The System
        </button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Exercise, Workout } from '@/types';
import { formatWeight, type WeightUnit } from '@/lib/weightUnits';
import { LIMITS } from '@/lib/inputValidation';

export interface LoggedSet {
  setNumber: number;
  reps: number;
  weightKg?: number | null;
}

export interface LoggedExercisePayload {
  exerciseName: string;
  weightKg?: number | null;
  targetSets: number;
  targetRepRange: string;
  sets: LoggedSet[];
}

interface WorkoutPerformanceModalProps {
  open: boolean;
  workout: Workout;
  onClose: () => void;
  onSubmit: (payload: {
    dayType: string;
    workoutId: string;
    durationMin?: number;
    exercises: LoggedExercisePayload[];
  }) => Promise<void>;
  submitting?: boolean;
  weightUnit?: 'kg' | 'lbs';
}

const AVAILABLE_WEIGHTS_KG = [5, 7.5, 10, 12.5, 15];

function isLoggable(ex: Exercise) {
  if (ex.trackingType === 'steps') return false;
  const n = ex.name.toLowerCase();
  if (n.includes('cardio') || n.includes('stretch') || n.includes('mobility') || n.includes('recovery')) {
    return false;
  }
  return true;
}

function parseMaxReps(range: string) {
  if (/amrap/i.test(range)) return 10;
  if (/sec/i.test(range)) return Number((range.match(/\d+/) || ['30'])[0]);
  const nums = range.match(/\d+/g);
  if (!nums?.length) return 10;
  return Number(nums[nums.length - 1]);
}

export default function WorkoutPerformanceModal({
  open,
  workout,
  onClose,
  onSubmit,
  submitting,
  weightUnit = 'kg',
}: WorkoutPerformanceModalProps) {
  const loggable = useMemo(() => workout.exercises.filter(isLoggable), [workout.exercises]);

  const [weights, setWeights] = useState<Record<string, number | null>>({});
  const [reps, setReps] = useState<Record<string, number[]>>({});
  const [durationMin, setDurationMin] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    const w: Record<string, number | null> = {};
    const r: Record<string, number[]> = {};
    for (const ex of loggable) {
      w[ex._id] =
        ex.currentWeightKg ??
        (ex.modality === 'dumbbell' ? 10 : null);
      const max = parseMaxReps(ex.repRange);
      const last = ex.lastPerformance?.sets;
      r[ex._id] =
        last && last.length === ex.sets
          ? [...last]
          : Array.from({ length: ex.sets }, () => Math.max(1, Math.floor(max * 0.8)));
    }
    setWeights(w);
    setReps(r);
    setDurationMin('');
  }, [open, loggable]);

  if (!open) return null;

  const setRep = (exId: string, idx: number, value: number) => {
    setReps((prev) => {
      const copy = [...(prev[exId] || [])];
      const n = Number.isFinite(value) ? value : 0;
      copy[idx] = Math.max(LIMITS.repsMin, Math.min(LIMITS.repsMax, Math.round(n)));
      return { ...prev, [exId]: copy };
    });
  };

  const handleSubmit = async () => {
    if (durationMin.trim()) {
      const d = Number(durationMin);
      if (
        !Number.isFinite(d) ||
        d < LIMITS.workoutDurationMin ||
        d > LIMITS.workoutDurationMax
      ) {
        alert(
          `Duration must be between ${LIMITS.workoutDurationMin} and ${LIMITS.workoutDurationMax} minutes`
        );
        return;
      }
    }

    const exercises: LoggedExercisePayload[] = loggable.map((ex) => ({
      exerciseName: ex.name,
      weightKg: weights[ex._id] ?? null,
      targetSets: ex.sets,
      targetRepRange: ex.repRange,
      sets: (reps[ex._id] || []).map((rep, i) => ({
        setNumber: i + 1,
        reps: Math.max(LIMITS.repsMin, Math.min(LIMITS.repsMax, rep)),
        weightKg: weights[ex._id] ?? null,
      })),
    }));

    await onSubmit({
      dayType: workout.dayType,
      workoutId: workout._id,
      durationMin: durationMin ? Number(durationMin) : undefined,
      exercises,
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto glass-panel !p-3 space-y-3 border border-cyan-500/30 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-neon-teal/80">
              Performance Log
            </p>
            <h3 className="text-base font-bold text-white">Enter sets for today&apos;s grind</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Double progression — weight only increases when every set hits the top of the range.
            </p>
          </div>
          <button type="button" className="workout-bulk-btn workout-bulk-btn-muted" onClick={onClose}>
            Close
          </button>
        </div>

        <label className="block text-[10px] uppercase tracking-wider text-slate-500">
          Session duration (min, optional)
          <input
            type="number"
            min={LIMITS.workoutDurationMin}
            max={LIMITS.workoutDurationMax}
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            className="mt-1 w-full bg-slate-950/70 border border-cyan-500/25 rounded px-2.5 py-1.5 text-sm text-slate-200"
          />
        </label>

        <ul className="space-y-3">
          {loggable.map((ex) => (
            <li key={ex._id} className="lifetime-stat-card !p-2.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-white truncate">{ex.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono-data">
                    Target {ex.sets}×{ex.repRange}
                    {ex.coachNote ? ` · ${ex.coachNote}` : ''}
                  </p>
                </div>
                {ex.modality === 'dumbbell' && (
                  <select
                    value={weights[ex._id] ?? 10}
                    onChange={(e) =>
                      setWeights((prev) => ({ ...prev, [ex._id]: Number(e.target.value) }))
                    }
                    className="text-[11px] bg-slate-950/80 border border-cyan-500/30 rounded px-2 py-1 text-neon-teal font-mono-data"
                  >
                    {AVAILABLE_WEIGHTS_KG.map((w) => (
                      <option key={w} value={w}>
                        {formatWeight(w, weightUnit as WeightUnit)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(reps[ex._id] || []).map((rep, idx) => (
                  <label key={idx} className="text-[9px] text-slate-500 uppercase tracking-wider">
                    Set {idx + 1}
                    <input
                      type="number"
                      min={LIMITS.repsMin}
                      max={LIMITS.repsMax}
                      value={rep}
                      onChange={(e) => setRep(ex._id, idx, Number(e.target.value))}
                      className="mt-0.5 w-full bg-slate-950/70 border border-cyan-500/20 rounded px-1.5 py-1 text-sm text-center text-white font-mono-data"
                    />
                  </label>
                ))}
              </div>
              {ex.lastPerformance?.sets?.length ? (
                <p className="text-[10px] text-slate-500 font-mono-data">
                  Last: {ex.lastPerformance.sets.join(' / ')}
                  {ex.bestPerformance?.sets?.length
                    ? ` · Best: ${ex.bestPerformance.sets.join(' / ')}`
                    : ''}
                </p>
              ) : null}
            </li>
          ))}
        </ul>

        <button
          type="button"
          disabled={submitting || loggable.length === 0}
          onClick={handleSubmit}
          className="w-full workout-bulk-btn !py-2.5 text-[12px]"
        >
          {submitting ? 'Analyzing…' : 'Submit & Get Coach Feedback'}
        </button>
      </div>
    </div>
  );
}

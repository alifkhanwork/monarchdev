'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ProgressAnalytics, WorkoutSession } from '@/types';

interface TrainingProgressSectionProps {
  onGoTrain?: () => void;
}

export default function TrainingProgressSection({ onGoTrain }: TrainingProgressSectionProps) {
  const [analytics, setAnalytics] = useState<ProgressAnalytics | null>(null);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, h] = await Promise.all([api.getProgressAnalytics(), api.getWorkoutHistory(12)]);
        if (!cancelled) {
          setAnalytics(a);
          setHistory(h.sessions || []);
        }
      } catch {
        // non-fatal
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="glass-panel flex justify-center py-8">
        <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-2.5">
      <div className="glass-panel">
        <p className="panel-label mb-1">Progressive Overload</p>
        <p className="text-[10px] text-slate-400 mb-3">
          Training start Jul 27, 2026 · Week {analytics.trainingWeek}
          {analytics.beginnerPhase ? ' · Form-first phase (Weeks 1–4)' : ''}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="lifetime-stat-card">
            <p className="text-[10px] text-slate-400 uppercase">Weekly Volume</p>
            <p className="text-xl font-bold font-mono-data text-glow-gold">
              {analytics.weeklyVolumeKg.toLocaleString()} kg
            </p>
          </div>
          <div className="lifetime-stat-card">
            <p className="text-[10px] text-slate-400 uppercase">Monthly Volume</p>
            <p className="text-xl font-bold font-mono-data text-neon-teal">
              {analytics.monthlyVolumeKg.toLocaleString()} kg
            </p>
          </div>
          <div className="lifetime-stat-card">
            <p className="text-[10px] text-slate-400 uppercase">Sessions</p>
            <p className="text-xl font-bold font-mono-data text-cyan-300">
              {analytics.sessionsLogged}
            </p>
          </div>
          <div className="lifetime-stat-card">
            <p className="text-[10px] text-slate-400 uppercase">Avg Duration</p>
            <p className="text-xl font-bold font-mono-data text-slate-200">
              {analytics.averageDurationMin != null ? `${analytics.averageDurationMin}m` : '—'}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
          <p className="text-slate-400">
            Most improved:{' '}
            <span className="text-white font-semibold">
              {analytics.mostImprovedExercise?.exerciseName || '—'}
            </span>
          </p>
          <p className="text-slate-400">
            Strongest signal:{' '}
            <span className="text-white font-semibold">
              {analytics.strongestExercise?.exerciseName || '—'}
            </span>
          </p>
        </div>
      </div>

      <div className="glass-panel">
        <p className="panel-label mb-2">Training History</p>
        {history.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <p className="text-sm text-slate-300">Log your first set to start tracking PRs</p>
            <p className="text-meta">
              Finish today&apos;s workout and submit set reps — history builds here.
            </p>
            {onGoTrain && (
              <button type="button" className="journal-action-btn" onClick={onGoTrain}>
                Open Daily Grind
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {history.map((s) => (
              <li key={s._id || s.dateKey} className="lifetime-stat-card !p-2.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[12px] font-semibold text-white">
                    {s.dateKey} · {s.dayType}
                  </p>
                  <p className="text-[10px] font-mono-data text-amber-300/90">
                    {s.totalVolumeKg?.toLocaleString() || 0} kg · ★{s.coachSummary?.rating ?? '—'}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 mb-1">{s.coachSummary?.headline}</p>
                <ul className="space-y-0.5">
                  {s.exercises.slice(0, 4).map((ex) => (
                    <li key={ex.exerciseName} className="text-[10px] font-mono-data text-slate-400">
                      {ex.exerciseName}
                      {ex.weightKg != null ? ` @ ${ex.weightKg}kg` : ''} —{' '}
                      {ex.sets.map((x) => x.reps).join('/')}
                      {ex.verdict === 'progress' ? ' ↑' : ''}
                    </li>
                  ))}
                  {s.exercises.length > 4 && (
                    <li className="text-[10px] text-slate-400">+{s.exercises.length - 4} more</li>
                  )}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import type { DailyTask, DayStatusInfo, GroupedTasks, Workout } from '@/types';
import DayStatusSelect from './DayStatusSelect';
import CollapsibleCategoryHeader from '@/components/quests/CollapsibleCategoryHeader';
import { useCollapsibleSections } from '@/hooks/useCollapsibleSections';
import { formatWeight, type WeightUnit } from '@/lib/weightUnits';

interface DailyTaskListProps {
  groupedTasks: GroupedTasks[];
  workout: Workout | null;
  dayType: string;
  dayStatus: DayStatusInfo;
  journalFilled: boolean;
  todayEarned: number;
  todayPossible: number;
  onDayStatusChange: (status: string) => void;
  onToggleTask: (taskId: string, isCompleted: boolean) => void;
  onToggleExercise: (workoutId: string, exerciseId: string) => void;
  onCompleteAllExercises: (workoutId: string) => void;
  onClearAllExercises: (workoutId: string) => void;
  onAddSteps?: (workoutId: string, exerciseId: string, delta: number) => void;
  onLogPerformance?: () => void;
  workoutQuest: DailyTask | null;
  workoutSyncing: boolean;
  onLogValueChange: (taskId: string, value: number) => void;
  completingId: string | null;
  flashingId: string | null;
  weightUnit?: WeightUnit;
}

const DAY_TYPE_LABELS: Record<string, string> = {
  Upper: 'Upper',
  Lower: 'Lower',
  ActiveRecovery: 'Active Recovery',
  Push: 'Push',
  Pull: 'Pull',
  Legs: 'Legs',
  Recovery: 'Recovery',
};

const WORKOUT_DAILY_TASK_NAME = 'Complete workout of the day';
const STEP_DELTAS = [500, 1000, 2500];
const COLLAPSE_KEY = 'the-system-daily-collapse';

const STAT_SHORT: Record<string, string> = {
  strength: 'STR',
  intelligence: 'INT',
  perception: 'PER',
  vitality: 'VIT',
  agility: 'END',
};

function QuestLogStepper({
  task,
  disabled,
  onCommit,
}: {
  task: DailyTask;
  disabled?: boolean;
  onCommit: (taskId: string, value: number) => void;
}) {
  const step = task.logUnit === 'hr' ? 0.25 : 1;
  const max =
    task.lifetimeMetric === 'water_liters'
      ? 20
      : task.lifetimeMetric === 'study_hours'
        ? 16
        : task.lifetimeMetric === 'distance_km'
          ? 200
          : task.lifetimeMetric === 'steps'
            ? 100_000
            : 10_000;

  const bump = (dir: 1 | -1) => {
    const next = Math.max(
      0,
      Math.min(max, Math.round((task.logValue + dir * step) * 100) / 100)
    );
    if (next !== task.logValue) onCommit(task._id, next);
  };

  return (
    <div className="stepper-chip" title={`Log ${task.logUnit} (max ${max})`}>
      <button
        type="button"
        className="stepper-btn"
        disabled={disabled || task.logValue <= 0}
        onClick={(e) => {
          e.stopPropagation();
          bump(-1);
        }}
        aria-label={`Decrease ${task.logUnit}`}
      >
        −
      </button>
      <span className="stepper-val">
        {task.logValue}
        <span className="text-[9px] text-slate-500 ml-0.5 uppercase">{task.logUnit}</span>
      </span>
      <button
        type="button"
        className="stepper-btn"
        disabled={disabled || task.logValue >= max}
        onClick={(e) => {
          e.stopPropagation();
          bump(+1);
        }}
        aria-label={`Increase ${task.logUnit}`}
      >
        +
      </button>
    </div>
  );
}

function formatStatRewards(task: DailyTask) {
  const rewards = task.statRewards?.length
    ? task.statRewards
    : [{ stat: task.statModifier, amount: 1 }];
  return rewards
    .map((r) => `+${r.amount} ${STAT_SHORT[r.stat] || r.stat.toUpperCase()}`)
    .join(' · ');
}

function normalizeTask(task: DailyTask): DailyTask {
  let name = task.taskName;
  let category = task.category;

  if (name.toLowerCase().includes('portfolio') || name.toLowerCase().includes('job apps')) {
    name = 'Work for Company';
    category = 'Mental';
  } else if (name === "Complete Today's Most Important Task") {
    category = 'Health';
  }

  return {
    ...task,
    taskName: name,
    category,
  };
}

export default function DailyTaskList({
  groupedTasks,
  workout,
  dayType,
  dayStatus,
  journalFilled,
  todayEarned,
  todayPossible,
  onDayStatusChange,
  onToggleTask,
  onToggleExercise,
  onCompleteAllExercises,
  onClearAllExercises,
  onAddSteps,
  onLogPerformance,
  workoutQuest,
  workoutSyncing,
  onLogValueChange,
  completingId,
  flashingId,
  weightUnit = 'kg',
}: DailyTaskListProps) {
  const isFrozen = dayStatus.isFrozen;
  const isRecovery = Boolean(workout?.isRecovery);

  const handleTaskClick = (task: DailyTask) => {
    if (isFrozen || completingId) return;

    if (task.isCompleted) {
      onToggleTask(task._id, true);
      return;
    }

    const isJournalTask = task.taskName.toLowerCase().includes('journal');
    if (isJournalTask && !journalFilled && !isFrozen) {
      alert('Complete your End of Day Journal entry before marking this quest.');
      return;
    }

    onToggleTask(task._id, false);
  };

  const normalizedTasks = useMemo(() => {
    const all: DailyTask[] = [];
    for (const g of groupedTasks) {
      for (const t of g.tasks) {
        if (t.taskName !== WORKOUT_DAILY_TASK_NAME) {
          all.push(normalizeTask(t));
        }
      }
    }
    return all;
  }, [groupedTasks]);

  const healthTasks = useMemo(
    () => normalizedTasks.filter((t) => t.category === 'Health'),
    [normalizedTasks]
  );

  const mentalTasks = useMemo(
    () => normalizedTasks.filter((t) => t.category === 'Mental'),
    [normalizedTasks]
  );

  const otherTasks = useMemo(
    () => normalizedTasks.filter((t) => t.category !== 'Health' && t.category !== 'Mental'),
    [normalizedTasks]
  );

  const completedCount = normalizedTasks.filter((t) => t.isCompleted).length;
  const totalCount = normalizedTasks.length;

  const workoutCompleted = workout?.exercises.every((ex) => ex.completed) ?? false;
  const workoutDoneCount = workout?.exercises.filter((ex) => ex.completed).length ?? 0;
  const workoutTotal = workout?.exercises.length ?? 0;
  const completionPercent =
    workout?.completionPercent ??
    (workoutTotal ? Math.round((workoutDoneCount / workoutTotal) * 100) : 0);

  const sectionIds = useMemo(() => ['Health', 'Mental'], []);

  const { isCollapsed, toggle } = useCollapsibleSections(
    COLLAPSE_KEY,
    sectionIds,
    null
  );

  const renderTaskRow = (task: DailyTask) => {
    const hasLog = task.lifetimeMetric && task.lifetimeMetric !== 'none';
    return (
      <li key={task._id}>
        <div
          className={`quest-item w-full ${task.isCompleted ? 'quest-item-done' : ''} ${
            flashingId === task._id ? 'quest-item-flash' : ''
          }`}
        >
          <button
            type="button"
            onClick={() => handleTaskClick(task)}
            disabled={isFrozen || completingId === task._id}
            className="quest-hit -ml-1"
            aria-pressed={task.isCompleted}
            aria-label={task.taskName}
          >
            <span
              className={`quest-checkbox ${
                task.isCompleted ? 'quest-checkbox-done' : ''
              }`}
            >
              {task.isCompleted && '✓'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleTaskClick(task)}
            disabled={isFrozen || completingId === task._id}
            className="flex-1 min-w-0 text-left flex items-center gap-2"
          >
            <span
              className={`text-[13px] sm:text-sm truncate ${
                task.isCompleted ? 'line-through text-slate-500' : 'text-white'
              }`}
            >
              {task.taskName}
            </span>
            <span className="quest-meta-pill hidden sm:inline">
              +{task.expReward} EXP · {formatStatRewards(task)}
            </span>
          </button>
          <span className="quest-meta-pill sm:hidden">+{task.expReward}</span>
          {hasLog && (
            <QuestLogStepper
              task={task}
              disabled={isFrozen}
              onCommit={onLogValueChange}
            />
          )}
        </div>
      </li>
    );
  };

  return (
    <div className={`glass-panel flex flex-col gap-3 !p-3 ${isFrozen ? 'opacity-90' : ''}`}>
      {/* Daily Quests Dashboard Header */}
      <div className="panel-header !pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="panel-label">Daily Quests</span>
          <span className="text-meta truncate hidden sm:inline">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DayStatusSelect currentStatus={dayStatus.status} onStatusChange={onDayStatusChange} />
          <span className="text-[11px] font-mono-data text-amber-300/90">
            {todayEarned}/{todayPossible} EXP · {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      {dayStatus.badge && (
        <div className="px-2 py-1 rounded border border-cyan-500/25 bg-cyan-500/5 text-center">
          <p className="text-[11px] font-semibold text-cyan-300 tracking-wide">{dayStatus.badge}</p>
        </div>
      )}

      {/* Row 1: Health (50% Left) & Mental (50% Right) */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${
          isFrozen ? 'pointer-events-none select-none opacity-50' : ''
        }`}
      >
        {/* Health Column */}
        <section className="glass-panel !p-3 flex flex-col justify-between border-emerald-500/20 bg-slate-900/40">
          <div>
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-emerald-500/15 mb-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <span aria-hidden className="text-emerald-400">♥</span>
                <span className="font-semibold text-white text-sm">Health</span>
                <span className="text-slate-400 font-mono-data text-xs normal-case tracking-normal">
                  ({healthTasks.filter((t) => t.isCompleted).length}/{healthTasks.length} cleared)
                  {healthTasks.length > 0 && healthTasks.every((t) => t.isCompleted) ? ' · done' : ''}
                </span>
              </div>
            </div>
            <ul className="space-y-1.5">
              {healthTasks.map((task) => renderTaskRow(task))}
            </ul>
          </div>
        </section>

        {/* Mental Column */}
        <section className="glass-panel !p-3 flex flex-col justify-between border-cyan-500/20 bg-slate-900/40">
          <div>
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-cyan-500/15 mb-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <span aria-hidden className="text-cyan-400">✦</span>
                <span className="font-semibold text-white text-sm">Mental</span>
                <span className="text-slate-400 font-mono-data text-xs normal-case tracking-normal">
                  ({mentalTasks.filter((t) => t.isCompleted).length}/{mentalTasks.length} cleared)
                  {mentalTasks.length > 0 && mentalTasks.every((t) => t.isCompleted) ? ' · done' : ''}
                </span>
              </div>
            </div>
            <ul className="space-y-1.5">
              {mentalTasks.map((task) => renderTaskRow(task))}
            </ul>
          </div>
        </section>
      </div>

      {/* Other Tasks if any */}
      {otherTasks.length > 0 && (
        <section className="glass-panel !p-3 border-slate-700/40 bg-slate-900/40">
          <ul className="space-y-1.5">
            {otherTasks.map((task) => renderTaskRow(task))}
          </ul>
        </section>
      )}

      {/* Row 2: Workout Section (100% Full Width, Always Expanded, Non-collapsible) */}
      {workout && (
        <section
          className={`glass-panel !p-3 border-cyan-500/25 bg-slate-900/60 ${
            isFrozen ? 'pointer-events-none select-none opacity-50' : ''
          }`}
        >
          {/* Non-collapsible Workout Header (No Toggle Arrow) */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-cyan-500/15 mb-2">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span aria-hidden className="text-cyan-400">⚔</span>
              <span className="font-semibold text-white text-sm">Workout</span>
              <span className="normal-case px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-medium text-xs tracking-normal">
                {DAY_TYPE_LABELS[dayType] || dayType}
              </span>
              <span className="text-slate-400 font-mono-data text-xs normal-case tracking-normal">
                ({workoutDoneCount}/{workoutTotal} cleared)
                {workoutTotal > 0 && workoutDoneCount === workoutTotal ? ' · done' : ''}
              </span>
            </div>
            {!isRecovery && (
              <div className="flex items-center gap-2 shrink-0">
                {!workoutCompleted ? (
                  <button
                    type="button"
                    disabled={isFrozen || workoutSyncing}
                    onClick={() => onCompleteAllExercises(workout._id)}
                    className="workout-bulk-btn"
                  >
                    Check All
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isFrozen || workoutSyncing}
                    onClick={() => onClearAllExercises(workout._id)}
                    className="workout-bulk-btn workout-bulk-btn-muted"
                  >
                    Clear All
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Workout Body */}
          <div className="space-y-2">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${completionPercent}%` }} />
            </div>

            {workoutCompleted && workoutQuest && (
              <div className="px-2 py-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 space-y-1.5">
                <p className="text-[11px] font-semibold text-emerald-400">
                  ✓ Workout complete — +{workoutQuest.expReward} EXP
                  {workoutQuest.statRewards?.length
                    ? ` · ${formatStatRewards(workoutQuest)}`
                    : ''}
                </p>
                {onLogPerformance && !isRecovery && (
                  <button
                    type="button"
                    disabled={isFrozen || workoutSyncing}
                    onClick={onLogPerformance}
                    className="workout-bulk-btn w-full"
                  >
                    Log Sets & Get Coach Feedback
                  </button>
                )}
              </div>
            )}

            {!workoutCompleted && onLogPerformance && !isRecovery && workoutDoneCount > 0 && (
              <button
                type="button"
                disabled={isFrozen || workoutSyncing}
                onClick={onLogPerformance}
                className="workout-bulk-btn workout-bulk-btn-muted w-full"
              >
                Log Performance Early
              </button>
            )}

            <ul className="space-y-1.5">
              {workout.exercises.map((exercise) => {
                const isSteps = exercise.trackingType === 'steps';
                const steps = exercise.currentSteps ?? 0;
                const target = exercise.stepTarget ?? 10000;

                if (isSteps) {
                  return (
                    <li key={exercise._id}>
                      <div
                        className={`quest-item w-full flex-col !items-stretch !gap-2 ${
                          exercise.completed ? 'quest-item-done' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="quest-hit -ml-1 pointer-events-none">
                            <span
                              className={`quest-checkbox ${
                                exercise.completed ? 'quest-checkbox-done' : ''
                              }`}
                            >
                              {exercise.completed && '✓'}
                            </span>
                          </span>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-[13px] sm:text-sm ${
                                exercise.completed
                                  ? 'line-through text-slate-500'
                                  : 'text-white'
                              }`}
                            >
                              {exercise.name}
                            </p>
                            <p className="text-[11px] font-mono-data text-neon-teal mt-0.5">
                              {steps.toLocaleString()} / {target.toLocaleString()} Steps
                            </p>
                          </div>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(100, Math.round((steps / target) * 100))}%`,
                            }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {STEP_DELTAS.map((d) => (
                            <button
                              key={d}
                              type="button"
                              disabled={isFrozen || workoutSyncing || steps >= target}
                              onClick={() => onAddSteps?.(workout._id, exercise._id, d)}
                              className="workout-bulk-btn"
                            >
                              +{d.toLocaleString()}
                            </button>
                          ))}
                          {steps > 0 && (
                            <button
                              type="button"
                              disabled={isFrozen || workoutSyncing}
                              onClick={() => onAddSteps?.(workout._id, exercise._id, -500)}
                              className="workout-bulk-btn workout-bulk-btn-muted"
                            >
                              −500
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={exercise._id}>
                    <button
                      type="button"
                      onClick={() => onToggleExercise(workout._id, exercise._id)}
                      disabled={isFrozen || workoutSyncing}
                      className={`quest-item w-full text-left ${
                        exercise.completed ? 'quest-item-done' : ''
                      }`}
                    >
                      <span className="quest-hit -ml-1">
                        <span
                          className={`quest-checkbox ${
                            exercise.completed ? 'quest-checkbox-done' : ''
                          }`}
                        >
                          {exercise.completed && '✓'}
                        </span>
                      </span>
                      <span
                        className={`flex-1 min-w-0 text-[13px] sm:text-sm truncate ${
                          exercise.completed ? 'line-through text-slate-500' : 'text-white'
                        }`}
                      >
                        {exercise.name}
                        {exercise.currentWeightKg != null && (
                          <span className="text-neon-teal/80 font-mono-data text-[11px] ml-1.5">
                            {formatWeight(exercise.currentWeightKg, weightUnit)}
                          </span>
                        )}
                      </span>
                      <span className="quest-meta-pill">
                        {exercise.sets}×{exercise.repRange}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

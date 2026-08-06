'use client';

import { useMemo, useState, useRef } from 'react';
import type { DailyTask, DayStatusInfo, Exercise, GroupedTasks, Workout } from '@/types';
import DayStatusSelect from './DayStatusSelect';
import { formatWeight, type WeightUnit } from '@/lib/weightUnits';
import RestTimer from '@/components/workout/RestTimer';
import { api } from '@/lib/api';

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
  const isStudyMin = task.lifetimeMetric === 'study_hours' && task.taskName.toLowerCase().includes('10 min');
  const step = isStudyMin ? 1/60 : (task.logUnit === 'hr' ? 0.25 : 1);
  const max =
    task.lifetimeMetric === 'water_liters'
      ? 20
      : isStudyMin
        ? 120
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

export interface ExerciseCategoryGroup {
  category: string;
  exercises: Exercise[];
}

const CATEGORY_DISPLAY_ORDER = [
  'Chest',
  'Shoulders',
  'Triceps',
  'Back',
  'Biceps',
  'Legs',
  'Calves',
  'Core',
  'Cardio',
  'Recovery',
];

export function groupExercisesByCategory(exercises: Exercise[]): ExerciseCategoryGroup[] {
  if (!exercises || !Array.isArray(exercises)) return [];
  const map = new Map<string, Exercise[]>();
  for (const ex of exercises) {
    const cat = ex.category || 'Other';
    if (!map.has(cat)) {
      map.set(cat, []);
    }
    map.get(cat)!.push(ex);
  }

  const result: ExerciseCategoryGroup[] = [];
  for (const cat of CATEGORY_DISPLAY_ORDER) {
    if (map.has(cat)) {
      result.push({ category: cat, exercises: map.get(cat)! });
      map.delete(cat);
    }
  }
  for (const [cat, exList] of map.entries()) {
    result.push({ category: cat, exercises: exList });
  }
  return result;
}

export function splitCategoryGroupsIntoColumns(
  groups: ExerciseCategoryGroup[],
  numColumns: number = 3
): ExerciseCategoryGroup[][] {
  if (!groups || groups.length === 0) return Array.from({ length: numColumns }, () => []);

  const totalExercises = groups.reduce((sum, g) => sum + g.exercises.length, 0);
  const targetPerCol = Math.max(1, Math.ceil(totalExercises / numColumns));

  const columns: ExerciseCategoryGroup[][] = Array.from({ length: numColumns }, () => []);
  const colHeights = new Array(numColumns).fill(0);

  let colIdx = 0;
  for (const group of groups) {
    if (
      colHeights[colIdx] > 0 &&
      colHeights[colIdx] + group.exercises.length > targetPerCol + 1 &&
      colIdx < numColumns - 1
    ) {
      colIdx++;
    }
    columns[colIdx].push(group);
    colHeights[colIdx] += group.exercises.length;
  }

  return columns;
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
  const [showRestTimer, setShowRestTimer] = useState(false);

  const handleSetLogged = async (
    workoutId: string,
    exerciseId: string,
    setNumber: number,
    weightKg?: number | null,
    reps?: number
  ) => {
    try {
      const res = await api.logExerciseSet(workoutId, exerciseId, {
        setNumber,
        weightKg,
        reps,
        completed: true,
      });
      // Trigger rest timer for strength sets
      setShowRestTimer(true);
      if (res.isPR) {
        alert('🏆 NEW PERSONAL RECORD! Gold PR Badge unlocked.');
      }
    } catch (e: unknown) {
      console.error('Failed to log set:', e);
    }
  };

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



  const renderTaskRow = (task: DailyTask) => {
    const hasLog = task.lifetimeMetric && task.lifetimeMetric !== 'none';
    return (
      <li key={task._id}>
        <div
          className={`quest-item w-full flex items-center justify-between gap-2.5 ${
            task.isCompleted ? 'quest-item-done' : ''
          } ${flashingId === task._id ? 'quest-item-flash' : ''}`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => handleTaskClick(task)}
              disabled={isFrozen || completingId === task._id}
              className="quest-hit -ml-1 shrink-0"
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
                className={`text-[13px] sm:text-sm truncate font-medium ${
                  task.isCompleted ? 'line-through text-slate-500' : 'text-white'
                }`}
              >
                {task.taskName}
              </span>
              <span className="quest-meta-pill hidden sm:inline shrink-0">
                +{task.expReward} EXP · {formatStatRewards(task)}
              </span>
            </button>
            <span className="quest-meta-pill sm:hidden shrink-0">+{task.expReward}</span>
          </div>

          {hasLog && (
            <div className="shrink-0 ml-1">
              <QuestLogStepper
                task={task}
                disabled={isFrozen}
                onCommit={onLogValueChange}
              />
            </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-1">
              {splitCategoryGroupsIntoColumns(groupExercisesByCategory(workout.exercises), 2).map(
                (colGroups, colIdx) => (
                  <div key={colIdx} className="space-y-4">
                    {colGroups.map((group) => (
                      <div key={group.category} className="space-y-1.5">
                        <h4 className="text-[12px] font-bold text-cyan-400 uppercase tracking-wider px-1 pt-0.5">
                          {group.category}:
                        </h4>
                        <ul className="space-y-1.5">
                          {group.exercises.map((exercise) => {
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

                            const isStrength = exercise.category !== 'Cardio' && exercise.category !== 'Recovery' && !exercise.name.toLowerCase().includes('wall sit');

                            if (isStrength) {
                              return (
                                <StrengthExerciseRow
                                  key={exercise._id}
                                  exercise={exercise}
                                  workoutId={workout._id}
                                  isFrozen={isFrozen}
                                  workoutSyncing={workoutSyncing}
                                  weightUnit={weightUnit}
                                  onToggleExercise={onToggleExercise}
                                  onSetLogged={handleSetLogged}
                                />
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
                                    className={`flex-1 min-w-0 text-[13px] sm:text-sm ${
                                      exercise.completed ? 'line-through text-slate-500' : 'text-white'
                                    }`}
                                    title={exercise.name}
                                  >
                                    {exercise.name}
                                    {exercise.currentWeightKg != null && (
                                      <span className="text-neon-teal/80 font-mono-data text-[11px] ml-1.5 shrink-0 whitespace-nowrap">
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
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* Floating 90s Rest Timer */}
      {showRestTimer && (
        <RestTimer
          initialSeconds={90}
          onDismiss={() => setShowRestTimer(false)}
        />
      )}
    </div>
  );
}

function StrengthExerciseRow({
  exercise,
  workoutId,
  isFrozen,
  workoutSyncing,
  weightUnit,
  onToggleExercise,
  onSetLogged,
}: {
  exercise: Exercise;
  workoutId: string;
  isFrozen?: boolean;
  workoutSyncing?: boolean;
  weightUnit?: WeightUnit;
  onToggleExercise: (workoutId: string, exerciseId: string) => void;
  onSetLogged: (workoutId: string, exerciseId: string, setNumber: number, weightKg?: number | null, reps?: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [setInputs, setSetInputs] = useState<Record<number, { weight: string; reps: string }>>(() => {
    const init: Record<number, { weight: string; reps: string }> = {};
    const structs = exercise.setStructure?.length ? exercise.setStructure : [];
    for (let i = 1; i <= 5; i++) {
      const s = structs.find((item) => item.setNumber === i);
      const logged = exercise.loggedSets?.find((item) => item.setNumber === i);
      init[i] = {
        weight: logged?.weightKg != null ? String(logged.weightKg) : s?.suggestedWeight != null ? String(s.suggestedWeight) : '',
        reps: logged?.reps != null ? String(logged.reps) : s?.targetReps ? String(s.targetReps) : '10',
      };
    }
    return init;
  });

  const loggedSets = exercise.loggedSets || [];
  const completedSetCount = loggedSets.filter((s) => s.completed).length;
  const isAllDone = exercise.completed || completedSetCount >= 5;

  const handleLogSet = (setNumber: number) => {
    const inp = setInputs[setNumber] || { weight: '', reps: '10' };
    const w = inp.weight ? Number(inp.weight) : null;
    const r = inp.reps ? parseInt(inp.reps.replace(/\D/g, '') || '10', 10) : 10;

    onSetLogged(workoutId, exercise._id, setNumber, w, r);

    // Auto-focus next unlogged set
    const nextUnlogged = setNumber + 1;
    if (nextUnlogged <= 5) {
      setTimeout(() => {
        const nextEl = document.getElementById(`set-reps-input-${exercise._id}-${nextUnlogged}`);
        if (nextEl) nextEl.focus();
      }, 100);
    }
  };

  return (
    <li className="space-y-1">
      <div
        className={`quest-item w-full flex-col !items-stretch !p-2.5 transition-all ${
          isAllDone ? 'quest-item-done' : ''
        }`}
      >
        {/* Row Header */}
        <div
          className="flex items-start justify-between gap-2 cursor-pointer select-none"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExercise(workoutId, exercise._id);
              }}
              disabled={isFrozen || workoutSyncing}
              className="quest-hit -ml-1 shrink-0 mt-0.5"
            >
              <span className={`quest-checkbox ${isAllDone ? 'quest-checkbox-done' : ''}`}>
                {isAllDone && '✓'}
              </span>
            </button>

            <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1 pt-0.5">
              <span
                title={exercise.name}
                className={`text-[13px] sm:text-sm font-semibold break-words ${
                  isAllDone ? 'line-through text-slate-500' : 'text-white'
                }`}
              >
                {exercise.name}
              </span>

              {exercise.currentWeightKg != null && (
                <span className="text-neon-teal/90 font-mono-data text-[11px] px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 shrink-0 whitespace-nowrap">
                  {formatWeight(exercise.currentWeightKg, weightUnit)}
                </span>
              )}

              {/* Gold PR Badge */}
              {exercise.isPR && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/60 text-amber-300 font-bold font-mono-data text-[10px] shadow-sm shadow-amber-500/30 animate-pulse shrink-0 whitespace-nowrap">
                  🏆 PR
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            <span className="px-2 py-0.5 rounded-full font-mono-data text-[10px] font-bold border border-slate-700 bg-slate-950 text-slate-300 shrink-0 whitespace-nowrap">
              {completedSetCount}/5 sets
            </span>
            <span className="text-xs text-slate-400">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>

        {/* Inline Expanded Sets */}
        {expanded && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-2 animate-fade-in">
            <div className="grid grid-cols-[100px_1fr_1fr_auto] gap-2 px-2 text-[10px] uppercase font-bold text-slate-400">
              <span>Set Type</span>
              <span className="text-center">Weight</span>
              <span className="text-center">Reps</span>
              <span className="text-right">Log</span>
            </div>

            {[1, 2, 3, 4, 5].map((setNum) => {
              const logged = loggedSets.find((s) => s.setNumber === setNum);
              const isSetDone = logged?.completed ?? false;
              const isWarmup = setNum <= 2;
              const setLabel = isWarmup ? `Warmup ${setNum}` : `Working ${setNum - 2}`;

              return (
                <div
                  key={setNum}
                  className={`grid grid-cols-[100px_1fr_1fr_auto] items-center gap-2 p-2 rounded-lg border-l-4 border transition-all ${
                    isWarmup ? 'border-l-slate-500' : 'border-l-cyan-400'
                  } ${
                    isSetDone
                      ? 'bg-slate-950/80 border-slate-800/80 opacity-70'
                      : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isWarmup
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-cyan-950 border border-cyan-500/40 text-cyan-300'
                      }`}
                    >
                      {setLabel}
                    </span>
                  </div>

                  {/* Weight Input */}
                  <div className="flex justify-center items-center">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="kg"
                      value={setInputs[setNum]?.weight || ''}
                      onChange={(e) =>
                        setSetInputs((prev) => ({
                          ...prev,
                          [setNum]: { ...prev[setNum], weight: e.target.value },
                        }))
                      }
                      className="w-16 px-2 py-1 text-xs rounded-md bg-slate-950 border border-slate-700 text-white font-mono-data text-center focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Reps Input */}
                  <div className="flex justify-center items-center">
                    <input
                      id={`set-reps-input-${exercise._id}-${setNum}`}
                      type="text"
                      placeholder="reps"
                      value={setInputs[setNum]?.reps || ''}
                      onChange={(e) =>
                        setSetInputs((prev) => ({
                          ...prev,
                          [setNum]: { ...prev[setNum], reps: e.target.value },
                        }))
                      }
                      className="w-16 px-2 py-1 text-xs rounded-md bg-slate-950 border border-slate-700 text-white font-mono-data text-center focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Log Set Checkmark Button */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleLogSet(setNum)}
                      disabled={isFrozen || workoutSyncing}
                      className={`px-3 py-1 text-xs font-bold rounded-md border transition-all ${
                        isSetDone
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md'
                          : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950'
                      }`}
                    >
                      {isSetDone ? '✓ Logged' : 'Log'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </li>
  );
}

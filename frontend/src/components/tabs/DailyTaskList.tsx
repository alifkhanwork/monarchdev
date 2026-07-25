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

const CATEGORY_ICONS: Record<string, string> = {
  Foundation: '◆',
  Health: '♥',
  Mental: '✦',
  Professional: '⚡',
  Productivity: '⚡',
};

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

  const completedCount = groupedTasks.reduce(
    (sum, g) => sum + g.tasks.filter((t) => t.isCompleted).length,
    0
  );
  const totalCount = groupedTasks.reduce((sum, g) => sum + g.tasks.length, 0);

  const visibleGroupedTasks = useMemo(
    () =>
      groupedTasks.map((group) => ({
        ...group,
        tasks: group.tasks.filter((t) => t.taskName !== WORKOUT_DAILY_TASK_NAME),
      })),
    [groupedTasks]
  );

  const workoutCompleted = workout?.exercises.every((ex) => ex.completed) ?? false;
  const workoutDoneCount = workout?.exercises.filter((ex) => ex.completed).length ?? 0;
  const workoutTotal = workout?.exercises.length ?? 0;
  const completionPercent =
    workout?.completionPercent ??
    (workoutTotal ? Math.round((workoutDoneCount / workoutTotal) * 100) : 0);

  const sectionIds = useMemo(() => {
    const ids = visibleGroupedTasks.filter((g) => g.tasks.length > 0).map((g) => g.category);
    if (workout) ids.push('Workout');
    return ids;
  }, [visibleGroupedTasks, workout]);

  const defaultOpenId = useMemo(() => {
    let bestId: string | null = null;
    let bestIncomplete = -1;

    for (const group of visibleGroupedTasks) {
      if (group.tasks.length === 0) continue;
      const incomplete = group.tasks.filter((t) => !t.isCompleted).length;
      if (incomplete > bestIncomplete) {
        bestIncomplete = incomplete;
        bestId = group.category;
      }
    }

    if (workout && workoutTotal > 0) {
      const incomplete = workoutTotal - workoutDoneCount;
      if (incomplete > bestIncomplete) {
        bestId = 'Workout';
      }
    }

    return bestId;
  }, [visibleGroupedTasks, workout, workoutTotal, workoutDoneCount]);

  const { isCollapsed, toggle } = useCollapsibleSections(
    COLLAPSE_KEY,
    sectionIds,
    defaultOpenId
  );

  return (
    <div className={`glass-panel flex flex-col overflow-hidden !p-3 ${isFrozen ? 'opacity-90' : ''}`}>
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
        <div className="mt-2 px-2 py-1 rounded border border-cyan-500/25 bg-cyan-500/5 text-center">
          <p className="text-[11px] font-semibold text-cyan-300 tracking-wide">{dayStatus.badge}</p>
        </div>
      )}

      <div
        className={`mt-2 space-y-2 custom-scrollbar ${
          isFrozen ? 'pointer-events-none select-none opacity-50' : ''
        }`}
      >
        {visibleGroupedTasks.map((group) => {
          if (group.tasks.length === 0) return null;
          const done = group.tasks.filter((t) => t.isCompleted).length;
          const collapsed = isCollapsed(group.category);
          return (
            <section key={group.category}>
              <CollapsibleCategoryHeader
                title={group.category}
                icon={CATEGORY_ICONS[group.category] ?? '◇'}
                done={done}
                total={group.tasks.length}
                collapsed={collapsed}
                onToggle={() => toggle(group.category)}
              />
              {!collapsed && (
                <ul className="space-y-1.5 mt-1">
                  {group.tasks.map((task) => {
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
                  })}
                </ul>
              )}
            </section>
          );
        })}

        {workout && (
          <section>
            <CollapsibleCategoryHeader
              title="Workout"
              icon="⚔"
              done={workoutDoneCount}
              total={workoutTotal}
              collapsed={isCollapsed('Workout')}
              onToggle={() => toggle('Workout')}
              badge={
                <span className="normal-case px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-medium tracking-normal">
                  {DAY_TYPE_LABELS[dayType] || dayType}
                </span>
              }
              trailing={
                !isRecovery ? (
                  !workoutCompleted ? (
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
                  )
                ) : undefined
              }
            />

            {!isCollapsed('Workout') && (
              <div className="mt-1 space-y-1.5">
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
            )}
          </section>
        )}
      </div>
    </div>
  );
}

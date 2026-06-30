'use client';

import { useEffect, useState } from 'react';
import type { DailyTask, DayStatusInfo, GroupedTasks, Workout } from '@/types';
import DayStatusSelect from './DayStatusSelect';

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
  workoutQuest: DailyTask | null;
  workoutSyncing: boolean;
  onLogValueChange: (taskId: string, value: number) => void;
  completingId: string | null;
  flashingId: string | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  Foundation: '◆',
  Health: '♥',
  Mental: '✦',
  Professional: '⚡',
};

const DAY_TYPE_LABELS: Record<string, string> = {
  Upper: 'Upper Body',
  Lower: 'Lower Body',
  Rest: 'Rest / Recovery',
};

const WORKOUT_DAILY_TASK_NAME = 'Complete workout of the day';

function QuestLogInput({
  task,
  disabled,
  onCommit,
}: {
  task: DailyTask;
  disabled?: boolean;
  onCommit: (taskId: string, value: number) => void;
}) {
  const [draft, setDraft] = useState(String(task.logValue));

  useEffect(() => {
    setDraft(String(task.logValue));
  }, [task.logValue]);

  const commit = () => {
    const parsed = parseFloat(draft);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed !== task.logValue) {
      onCommit(task._id, parsed);
    } else {
      setDraft(String(task.logValue));
    }
  };

  return (
    <div className="flex items-center gap-1.5 ml-11 sm:ml-0 shrink-0 mt-1 sm:mt-0">
      <input
        type="number"
        min={0}
        step={task.logUnit === 'hr' ? 0.25 : 1}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="quest-log-input"
        aria-label={`Log ${task.logUnit} for ${task.taskName}`}
      />
      <span className="text-[10px] text-cyan-400/70 uppercase w-6">{task.logUnit}</span>
    </div>
  );
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
  workoutQuest,
  workoutSyncing,
  onLogValueChange,
  completingId,
  flashingId,
}: DailyTaskListProps) {
  const isFrozen = dayStatus.isFrozen;

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

  const visibleGroupedTasks = groupedTasks.map((group) => ({
    ...group,
    tasks: group.tasks.filter((t) => t.taskName !== WORKOUT_DAILY_TASK_NAME),
  }));

  const workoutCompleted = workout?.exercises.every((ex) => ex.completed) ?? false;
  const workoutDoneCount = workout?.exercises.filter((ex) => ex.completed).length ?? 0;
  const workoutTotal = workout?.exercises.length ?? 0;

  return (
    <div className={`glass-panel h-full flex flex-col overflow-hidden ${isFrozen ? 'opacity-90' : ''}`}>
      <div className="panel-header flex-wrap gap-2">
        <div>
          <span className="panel-label">Daily Quests</span>
          <p className="text-[10px] text-slate-500 mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <DayStatusSelect
            currentStatus={dayStatus.status}
            onStatusChange={onDayStatusChange}
          />
          <div className="text-right">
            <span className="text-xs text-cyan-300 font-semibold tabular-nums block">
              {completedCount}/{totalCount}
            </span>
            <span className="text-[10px] text-amber-400/90 font-semibold tabular-nums">
              Today&apos;s EXP: {todayEarned} / {todayPossible}
            </span>
          </div>
        </div>
      </div>

      {dayStatus.badge && (
        <div className="mt-3 px-3 py-2 rounded-lg border border-cyan-500/25 bg-cyan-500/5 text-center">
          <p className="text-xs font-semibold text-cyan-300 tracking-wide">{dayStatus.badge}</p>
        </div>
      )}

      <div
        className={`flex-1 overflow-y-auto space-y-5 mt-4 pr-1 custom-scrollbar ${
          isFrozen ? 'pointer-events-none select-none opacity-50' : ''
        }`}
      >
        {visibleGroupedTasks.map((group) => (
          <section key={group.category}>
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400/80 mb-2">
              <span>{CATEGORY_ICONS[group.category] ?? '◇'}</span>
              {group.category}
            </h3>
            <ul className="space-y-2">
              {group.tasks.map((task) => {
                const hasLog = task.lifetimeMetric && task.lifetimeMetric !== 'none';
                return (
                <li key={task._id}>
                  <div
                    className={`quest-item w-full ${
                      task.isCompleted ? 'quest-item-done' : ''
                    } ${flashingId === task._id ? 'quest-item-flash' : ''} ${
                      hasLog ? 'flex-wrap sm:flex-nowrap' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleTaskClick(task)}
                      disabled={isFrozen || completingId === task._id}
                      className="flex flex-1 min-w-0 items-center gap-3 text-left"
                    >
                      <span
                        className={`quest-checkbox shrink-0 ${task.isCompleted ? 'quest-checkbox-done' : ''}`}
                      >
                        {task.isCompleted && '✓'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            task.isCompleted ? 'line-through text-slate-500' : 'text-white'
                          }`}
                        >
                          {task.taskName}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          +{task.expReward} EXP · {task.statModifier.toUpperCase()}
                        </p>
                      </div>
                    </button>
                    {hasLog && (
                      <QuestLogInput
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
          </section>
        ))}

        {workout && (
          <section key="workout-of-the-day">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400/80">
                <span>⚔</span>
                Workout of the Day
              </h3>
              <span className="text-[10px] normal-case px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                {DAY_TYPE_LABELS[dayType] || dayType}
              </span>
              <span className="text-[10px] text-slate-500 tabular-nums">
                {workoutDoneCount}/{workoutTotal}
              </span>
              <div className="ml-auto">
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
            </div>

            {workoutQuest && (
              <p className="text-[10px] text-slate-500 mb-2 px-1">
                Reward:{' '}
                <span className="text-amber-400/90 font-semibold">
                  +{workoutQuest.expReward} EXP · {workoutQuest.statModifier.toUpperCase()}
                </span>
              </p>
            )}

            {workoutCompleted && workoutQuest && (
              <div className="mb-2 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                <p className="text-xs font-semibold text-emerald-400">
                  ✓ Workout complete — +{workoutQuest.expReward} EXP · +1{' '}
                  {workoutQuest.statModifier.toUpperCase()}
                </p>
              </div>
            )}

            <ul className="space-y-2">
              {workout.exercises.map((exercise) => (
                <li key={exercise._id}>
                  <button
                    type="button"
                    onClick={() => onToggleExercise(workout._id, exercise._id)}
                    disabled={isFrozen || workoutSyncing}
                    className={`quest-item w-full text-left ${
                      exercise.completed ? 'quest-item-done' : ''
                    }`}
                  >
                    <span
                      className={`quest-checkbox ${
                        exercise.completed ? 'quest-checkbox-done' : ''
                      }`}
                    >
                      {exercise.completed && '✓'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          exercise.completed ? 'line-through text-slate-500' : 'text-white'
                        }`}
                      >
                        {exercise.name}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {exercise.sets} sets · {exercise.repRange}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

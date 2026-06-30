'use client';

import type { DailyTask, GroupedTasks, Workout } from '@/types';

interface QuestBoardProps {
  groupedTasks: GroupedTasks[];
  workout: Workout | null;
  dayType: string;
  journalFilled: boolean;
  onToggleTask: (taskId: string, isCompleted: boolean) => void;
  onToggleExercise: (workoutId: string, exerciseId: string) => void;
  completingId: string | null;
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

export default function QuestBoard({
  groupedTasks,
  workout,
  dayType,
  journalFilled,
  onToggleTask,
  onToggleExercise,
  completingId,
}: QuestBoardProps) {
  const handleTaskClick = (task: DailyTask) => {
    if (completingId) return;

    if (task.isCompleted) {
      onToggleTask(task._id, true);
      return;
    }

    const isJournalTask = task.taskName.toLowerCase().includes('journal');
    if (isJournalTask && !journalFilled) {
      alert('Complete your End of Day Journal entry before marking this quest.');
      return;
    }

    onToggleTask(task._id, false);
  };

  return (
    <div className="panel h-full flex flex-col gap-4 overflow-hidden">
      <div className="panel-header">
        <span className="panel-label">Quest Board</span>
        <span className="text-xs text-system-muted">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
        {groupedTasks.map((group) => (
          <section key={group.category}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-system-accent mb-2">
              <span className="text-system-glow">{CATEGORY_ICONS[group.category] ?? '◇'}</span>
              {group.category}
            </h3>
            <ul className="space-y-2">
              {group.tasks.map((task) => (
                <li key={task._id}>
                  <button
                    type="button"
                    onClick={() => handleTaskClick(task)}
                    disabled={completingId === task._id}
                    className={`quest-item w-full text-left ${
                      task.isCompleted ? 'quest-item-done' : ''
                    }`}
                  >
                    <span
                      className={`quest-checkbox ${task.isCompleted ? 'quest-checkbox-done' : ''}`}
                    >
                      {task.isCompleted && '✓'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.isCompleted ? 'line-through text-system-muted' : 'text-white'}`}>
                        {task.taskName}
                      </p>
                      <p className="text-[10px] text-system-muted mt-0.5">
                        +{task.expReward} EXP · {task.statModifier.toUpperCase()}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {workout && (
          <section key="workout-of-the-day">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-system-accent mb-2">
              <span className="text-system-glow">⚔</span>
              Workout of the Day
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-system-glow/10 text-system-glow border border-system-glow/30">
                {DAY_TYPE_LABELS[dayType] || dayType}
              </span>
            </h3>
            <div className="rounded-lg border border-system-border/60 bg-system-bg/40 p-3 space-y-2">
              {workout.exercises.map((exercise) => (
                <label
                  key={exercise._id}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={exercise.completed}
                    onChange={() => onToggleExercise(workout._id, exercise._id)}
                    className="quest-native-checkbox"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${exercise.completed ? 'text-system-muted line-through' : 'text-white'}`}>
                      {exercise.name}
                    </p>
                    <p className="text-[10px] text-system-muted">
                      {exercise.sets} sets · {exercise.repRange}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

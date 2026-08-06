'use client';

import { useEffect, useState } from 'react';
import type { AcademyTask } from '@/types';
import { api } from '@/lib/api';

interface UpcomingDeadlinesCardProps {
  onGoToAcademy?: () => void;
  daysWindow?: number; // default 3
}

function formatDateReadable(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-').map(Number);
    if (parts.length < 3) return dateStr;
    const [y, m, d] = parts;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function UpcomingDeadlinesCard({
  onGoToAcademy,
  daysWindow = 3,
}: UpcomingDeadlinesCardProps) {
  const [tasks, setTasks] = useState<AcademyTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeadlines = async () => {
    try {
      setLoading(true);
      const res = await api.getAcademyTasks({ upcoming: true });
      setTasks(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeadlines();
  }, [daysWindow]);

  const handleToggleCompleted = async (taskId: string) => {
    try {
      // Optimistic remove
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      await api.updateAcademyTask(taskId, { status: 'Completed' });
      fetchDeadlines();
    } catch {
      fetchDeadlines();
    }
  };

  if (loading) return null;
  if (tasks.length === 0) return null;

  // Helper to format countdown label live relative to today
  const formatCountdown = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [y, m, d] = dueDateStr.split('-').map(Number);
    const due = new Date(y, m - 1, d);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysOver = Math.abs(diffDays);
      return {
        text: `Overdue by ${daysOver} day${daysOver > 1 ? 's' : ''}`,
        colorClass: 'text-red-400 font-bold',
      };
    }
    if (diffDays === 0) {
      return {
        text: 'Due today',
        colorClass: 'text-amber-400 font-bold',
      };
    }
    if (diffDays === 1) {
      return {
        text: 'You have 1 day',
        colorClass: 'text-cyan-300 font-medium',
      };
    }
    return {
      text: `You have ${diffDays} days`,
      colorClass: 'text-cyan-400/90 font-medium',
    };
  };

  const isLongList = tasks.length >= 8;

  return (
    <section className="glass-panel !p-3 space-y-2 border-cyan-500/25 bg-slate-900/60">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-cyan-500/15 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base" aria-hidden>
            📅
          </span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            DEADLINES ({tasks.length})
          </h3>
        </div>
        {onGoToAcademy && (
          <button
            type="button"
            onClick={onGoToAcademy}
            className="text-[10px] text-cyan-400 hover:underline font-semibold"
          >
            The Academy →
          </button>
        )}
      </div>

      <div
        className={`space-y-1.5 ${
          isLongList ? 'max-h-[320px] overflow-y-auto pr-1 scrollbar-thin' : ''
        }`}
      >
        {tasks.map((task) => {
          const sub = typeof task.subject === 'object' ? task.subject : null;
          const subColor = sub?.color || '#3b82f6';
          const subName = sub?.name || 'Subject';
          const countdown = formatCountdown(task.dueDate);

          return (
            <div
              key={task._id}
              className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/60 hover:border-cyan-500/30 transition-all flex items-center justify-between gap-3"
            >
              {/* Left side: Checkbox & Title & Subject Chip */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => handleToggleCompleted(task._id)}
                  className="w-4 h-4 rounded border border-slate-600 hover:border-cyan-400 flex items-center justify-center text-[10px] transition-colors shrink-0"
                  aria-label={`Mark ${task.title} complete`}
                  title="Mark Complete"
                />

                <span className="text-xs font-semibold text-slate-100 truncate">
                  {task.title}
                </span>

                <span
                  className="text-[9px] font-bold px-1.5 py-0.2 rounded text-white shrink-0 shadow-sm"
                  style={{ backgroundColor: subColor }}
                >
                  {subName}
                </span>
              </div>

              {/* Right side: Readable date & countdown label */}
              <div className="shrink-0 text-right flex flex-col items-end">
                <span className="text-[10px] font-mono-data text-slate-400">
                  {formatDateReadable(task.dueDate)}
                </span>
                <span className={`text-[11px] font-mono-data ${countdown.colorClass}`}>
                  {countdown.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

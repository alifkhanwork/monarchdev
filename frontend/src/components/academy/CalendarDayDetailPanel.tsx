'use client';

import { useEffect } from 'react';
import type { AcademyTask, AcademyTaskStatus } from '@/types';

interface CalendarDayDetailPanelProps {
  isOpen: boolean;
  dateKey: string;
  tasks: AcademyTask[];
  onClose: () => void;
  onToggleStatus: (taskId: string, currentStatus: AcademyTaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTaskForDate: (dateKey: string) => void;
}

export default function CalendarDayDetailPanel({
  isOpen,
  dateKey,
  tasks,
  onClose,
  onToggleStatus,
  onDeleteTask,
  onAddTaskForDate,
}: CalendarDayDetailPanelProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Format dateKey (YYYY-MM-DD) to full label (e.g. Thursday, August 6, 2026)
  const formatFullDate = (key: string) => {
    try {
      const [y, m, d] = key.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return key;
    }
  };

  const getNextStatus = (current: AcademyTaskStatus): AcademyTaskStatus => {
    if (current === 'To Do') return 'In Progress';
    if (current === 'In Progress') return 'Completed';
    return 'To Do';
  };

  const getStatusStyle = (status: AcademyTaskStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400';
      case 'In Progress':
        return 'bg-amber-950/80 border-amber-500/50 text-amber-300';
      case 'To Do':
      default:
        return 'bg-slate-800 border-slate-600 text-slate-300';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-md sm:h-full sm:max-h-[640px] p-5 bg-slate-900/95 border-cyan-500/30 rounded-xl shadow-2xl flex flex-col justify-between animate-modal-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
              <p className="panel-label mb-0.5">Calendar Day Overview</p>
              <h3 className="text-base font-bold text-white tracking-wide">
                📅 {formatFullDate(dateKey)}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 text-sm"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>

          {/* Task List */}
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-slate-400 italic">No tasks due on this date.</p>
              </div>
            ) : (
              tasks.map((task) => {
                const sub = typeof task.subject === 'object' ? task.subject : null;
                const subColor = sub?.color || '#3b82f6';
                const subName = sub?.name || 'Subject';
                const isDone = task.status === 'Completed';

                return (
                  <div
                    key={task._id}
                    className={`p-3 rounded-lg border border-slate-800 bg-slate-950/70 space-y-2 transition-all ${
                      isDone ? 'opacity-60' : 'hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white shrink-0"
                          style={{ backgroundColor: subColor }}
                        >
                          {subName}
                        </span>
                        <span className="text-[10px] font-mono-data text-slate-400">
                          {task.dueTime ? `🕒 ${task.dueTime}` : '🕒 All day'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteTask(task._id)}
                        className="text-slate-500 hover:text-red-400 text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    <p
                      className={`text-xs font-semibold ${
                        isDone ? 'line-through text-slate-400' : 'text-slate-100'
                      }`}
                    >
                      {task.title}
                    </p>

                    {task.notes && (
                      <p className="text-[10px] text-slate-400 line-clamp-2">
                        {task.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-900">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(task._id, getNextStatus(task.status))}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded border transition-all ${getStatusStyle(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Action */}
        <div className="pt-4 border-t border-slate-800 mt-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onAddTaskForDate(dateKey);
            }}
            className="journal-action-btn w-full text-xs"
          >
            + Add Task for This Date
          </button>
        </div>
      </div>
    </div>
  );
}

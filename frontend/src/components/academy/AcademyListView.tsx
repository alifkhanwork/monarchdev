'use client';

import { useState } from 'react';
import type { AcademyTask, AcademyTaskStatus, Subject } from '@/types';

interface AcademyListViewProps {
  tasks: AcademyTask[];
  subjects: Subject[];
  onStatusChange: (taskId: string, newStatus: AcademyTaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: () => void;
  onAddTaskForSubject?: (subjectId: string) => void;
  onAddSubject: () => void;
  onDeleteSubject: (subjectId: string) => void;
}

type ViewMode = 'subject' | 'kanban';

export default function AcademyListView({
  tasks,
  subjects,
  onStatusChange,
  onDeleteTask,
  onAddTask,
  onAddSubject,
  onDeleteSubject,
}: AcademyListViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('subject');
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>({});

  const toggleSubjectCollapse = (subId: string) => {
    setCollapsedSubjects((prev) => ({ ...prev, [subId]: !prev[subId] }));
  };

  const getNextStatus = (current: AcademyTaskStatus): AcademyTaskStatus => {
    if (current === 'To Do') return 'In Progress';
    if (current === 'In Progress') return 'Completed';
    return 'To Do';
  };

  const getStatusBadgeStyle = (status: AcademyTaskStatus) => {
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

  // Group tasks by subject
  const tasksBySubject = subjects.map((sub) => {
    const subTasks = tasks.filter((t) => {
      const sId = typeof t.subject === 'object' ? t.subject._id : t.subject;
      return sId === sub._id;
    });
    return { subject: sub, tasks: subTasks };
  });

  const knownSubjectIds = new Set(subjects.map((s) => s._id));
  const orphanTasks = tasks.filter((t) => {
    const sId = typeof t.subject === 'object' ? t.subject._id : t.subject;
    return !knownSubjectIds.has(sId);
  });

  if (orphanTasks.length > 0) {
    tasksBySubject.push({
      subject: { _id: 'other', name: 'General', color: '#64748b' },
      tasks: orphanTasks,
    });
  }

  // Kanban columns
  const KANBAN_COLUMNS: { status: AcademyTaskStatus; label: string; accent: string }[] = [
    { status: 'To Do', label: 'To Do', accent: 'border-slate-600 text-slate-300' },
    { status: 'In Progress', label: 'In Progress', accent: 'border-amber-500 text-amber-400' },
    { status: 'Completed', label: 'Completed', accent: 'border-emerald-500 text-emerald-400' },
  ];

  return (
    <div className="space-y-4">
      {/* View Mode Toggle & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass-panel !p-3">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('subject')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'subject'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📂 By Subject
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'kanban'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📋 Kanban Board
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddSubject}
            className="workout-bulk-btn workout-bulk-btn-muted text-xs"
          >
            + Add Subject
          </button>
          <button type="button" onClick={onAddTask} className="journal-action-btn text-xs">
            + Add Task
          </button>
        </div>
      </div>

      {/* 0 SUBJECTS EMPTY STATE */}
      {subjects.length === 0 && viewMode === 'subject' && (
        <div className="glass-panel text-center py-12 space-y-3">
          <span className="text-3xl block">📚</span>
          <h4 className="text-base font-bold text-white">No subjects yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add your first subject (e.g. Calculus, Data Structures) to organize your coursework and deadlines.
          </p>
          <button type="button" onClick={onAddSubject} className="journal-action-btn text-xs">
            + Add First Subject
          </button>
        </div>
      )}

      {/* SUBJECT GROUPED VIEW (4-COLUMN RESPONSIVE GRID) */}
      {viewMode === 'subject' && subjects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
          {tasksBySubject.map(({ subject, tasks: subTasks }) => {
            const isCollapsed = collapsedSubjects[subject._id];
            const completedCount = subTasks.filter((t) => t.status === 'Completed').length;

            return (
              <div
                key={subject._id}
                className="glass-panel !p-0 overflow-hidden border-l-4"
                style={{ borderLeftColor: subject.color }}
              >
                {/* Subject Header */}
                <div className="p-3 flex items-center justify-between bg-slate-900/80 border-b border-slate-800">
                  <div
                    className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                    onClick={() => toggleSubjectCollapse(subject._id)}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: subject.color }}
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white tracking-wide truncate">
                        {subject.name}
                      </h4>
                      {subject.code && (
                        <p className="text-[10px] text-slate-400 font-mono-data">
                          {subject.code}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-mono-data px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {completedCount}/{subTasks.length}
                    </span>
                    {subject._id !== 'other' && (
                      <button
                        type="button"
                        onClick={() => onDeleteSubject(subject._id)}
                        className="text-slate-500 hover:text-red-400 text-xs p-0.5"
                        title="Delete Subject"
                      >
                        ✕
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleSubjectCollapse(subject._id)}
                      className="text-xs text-slate-400 p-0.5"
                    >
                      {isCollapsed ? '▶' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Task List inside Quarter-Width Card */}
                {!isCollapsed && (
                  <div className="p-2 space-y-1.5 max-h-[300px] overflow-y-auto">
                    {subTasks.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => onAddTaskForSubject?.(subject._id)}
                        className="w-full py-3 px-3 rounded-lg border border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-950/40 hover:bg-slate-900/60 text-slate-400 hover:text-cyan-300 transition-all flex items-center justify-center gap-1.5 text-xs font-medium group"
                      >
                        <span className="text-cyan-400 group-hover:scale-110 transition-transform">
                          +
                        </span>
                        <span>Add task</span>
                      </button>
                    ) : (
                      <>
                        {subTasks.map((task) => {
                          const isDone = task.status === 'Completed';
                          return (
                            <div
                              key={task._id}
                              className={`p-2 rounded-lg border border-slate-800/80 bg-slate-950/60 space-y-1 transition-all ${
                                isDone ? 'opacity-50' : 'hover:border-cyan-500/30'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <p
                                  className={`text-xs font-semibold ${
                                    isDone ? 'line-through text-slate-500' : 'text-slate-200'
                                  }`}
                                >
                                  {task.title}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => onDeleteTask(task._id)}
                                  className="text-slate-500 hover:text-red-400 text-[11px]"
                                >
                                  ✕
                                </button>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                                <span className="text-[10px] font-mono-data text-slate-400">
                                  📅 {task.dueDate}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    onStatusChange(task._id, getNextStatus(task.status))
                                  }
                                  className={`px-2 py-0.5 text-[9px] font-bold rounded border ${getStatusBadgeStyle(
                                    task.status
                                  )}`}
                                >
                                  {task.status}
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Bottom quick-add row when subject has tasks */}
                        <button
                          type="button"
                          onClick={() => onAddTaskForSubject?.(subject._id)}
                          className="w-full py-1.5 px-2 rounded border border-dashed border-slate-800 hover:border-cyan-500/40 bg-slate-950/20 hover:bg-slate-900/40 text-slate-400 hover:text-cyan-300 transition-all flex items-center justify-center gap-1 text-[11px] font-medium mt-1"
                        >
                          <span>+ Add task</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className="glass-panel space-y-2.5 !p-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className={`text-xs uppercase font-bold tracking-wider ${col.accent}`}>
                    {col.label} ({colTasks.length})
                  </h4>
                </div>

                <div className="space-y-2">
                  {colTasks.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-4 text-center">
                      No tasks in {col.label}
                    </p>
                  ) : (
                    colTasks.map((task) => {
                      const sub = typeof task.subject === 'object' ? task.subject : null;
                      const subColor = sub?.color || '#3b82f6';
                      const subName = sub?.name || 'Subject';

                      return (
                        <div
                          key={task._id}
                          className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white"
                              style={{ backgroundColor: subColor }}
                            >
                              {subName}
                            </span>
                            <span className="text-[10px] font-mono-data text-slate-400">
                              📅 {task.dueDate}
                            </span>
                          </div>

                          <p
                            className={`text-xs font-semibold text-slate-100 ${
                              task.status === 'Completed' ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {task.title}
                          </p>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                            <button
                              type="button"
                              onClick={() => onStatusChange(task._id, getNextStatus(task.status))}
                              className="text-[10px] text-cyan-400 hover:underline font-bold"
                            >
                              Move → {getNextStatus(task.status)}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteTask(task._id)}
                              className="text-slate-500 hover:text-red-400 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

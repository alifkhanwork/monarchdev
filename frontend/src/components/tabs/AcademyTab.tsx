'use client';

import { useEffect, useState } from 'react';
import type { AcademyTask, AcademyTaskStatus, Subject } from '@/types';
import { api } from '@/lib/api';
import AcademyListView from '../academy/AcademyListView';
import AcademyCalendarView from '../academy/AcademyCalendarView';
import AddTaskModal from '../academy/AddTaskModal';
import AddSubjectModal from '../academy/AddSubjectModal';

export default function AcademyTab() {
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<AcademyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState<string | undefined>(undefined);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<AcademyTask | null>(null);

  const loadData = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      setError(null);
      const [subsRes, tasksRes] = await Promise.all([
        api.getAcademySubjects(),
        api.getAcademyTasks(),
      ]);
      setSubjects(subsRes);
      setTasks(tasksRes);
    } catch {
      setSubjects([]);
      setTasks([]);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: AcademyTaskStatus) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
      await api.updateAcademyTask(taskId, { status: newStatus });
      loadData(false);
    } catch {
      loadData(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      await api.deleteAcademyTask(taskId);
    } catch {
      loadData(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      setSubjects((prev) => prev.filter((s) => s._id !== subjectId));
      await api.deleteAcademySubject(subjectId);
      loadData(false);
    } catch {
      loadData(false);
    }
  };

  const handleOpenTaskModal = (dateKey?: string, subjectId?: string) => {
    setEditingTask(null);
    setSelectedDueDate(dateKey);
    setSelectedSubjectId(subjectId);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: AcademyTask) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskSaved = (savedTask?: AcademyTask) => {
    if (savedTask) {
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t._id === savedTask._id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = savedTask;
          return next;
        }
        return [savedTask, ...prev];
      });
    }
    loadData(false);
  };

  const handleSubjectSaved = (newSub: Subject) => {
    setSubjects((prev) => {
      const idx = prev.findIndex((s) => s._id === newSub._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newSub;
        return next;
      }
      return [...prev, newSub];
    });
    loadData(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="glass-panel border-l-4 border-l-cyan-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="panel-label mb-0.5">Academic Operations</p>
          <h2 className="text-xl sm:text-2xl font-bold font-mono-data text-white tracking-wide">
            🎓 THE ACADEMY
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage course subjects, assignments, and master deadline calendar
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950/80 border border-slate-800 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'list'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📋 List / Board View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'calendar'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📅 Master Calendar
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs rounded-lg bg-red-950/60 border border-red-500/40 text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-panel text-center py-12">
          <span className="text-xl animate-spin-slow inline-block mb-2">🎓</span>
          <p className="text-xs text-slate-400 font-mono-data">Loading Academic Records...</p>
        </div>
      ) : activeTab === 'list' ? (
        <AcademyListView
          tasks={tasks}
          subjects={subjects}
          onStatusChange={handleStatusChange}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
          onAddTask={() => handleOpenTaskModal()}
          onAddTaskForSubject={(subjectId) => handleOpenTaskModal(undefined, subjectId)}
          onAddSubject={() => setIsSubjectModalOpen(true)}
          onDeleteSubject={handleDeleteSubject}
        />
      ) : (
        <AcademyCalendarView
          tasks={tasks}
          subjects={subjects}
          onToggleTaskStatus={handleStatusChange}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
          onOpenAddModalWithDate={(dateKey) => handleOpenTaskModal(dateKey)}
        />
      )}

      {/* Add / Edit Task Modal */}
      <AddTaskModal
        isOpen={isTaskModalOpen}
        subjects={subjects}
        initialDueDate={selectedDueDate}
        initialSubjectId={selectedSubjectId}
        editingTask={editingTask}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onTaskCreated={handleTaskSaved}
        onSubjectCreated={handleSubjectSaved}
      />

      {/* Add Subject Modal */}
      <AddSubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onSubjectSaved={handleSubjectSaved}
      />
    </div>
  );
}

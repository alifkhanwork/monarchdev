'use client';

import { useEffect, useState } from 'react';
import type { AcademyTaskStatus, Subject } from '@/types';
import { api } from '@/lib/api';

interface AddTaskModalProps {
  isOpen: boolean;
  subjects: Subject[];
  initialDueDate?: string;
  initialSubjectId?: string;
  onClose: () => void;
  onTaskCreated: () => void;
  onSubjectCreated?: (subject: Subject) => void;
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#ef4444', // Red
  '#a855f7', // Violet
];

export default function AddTaskModal({
  isOpen,
  subjects,
  initialDueDate,
  initialSubjectId,
  onClose,
  onTaskCreated,
  onSubjectCreated,
}: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(
    initialSubjectId || subjects[0]?._id || ''
  );
  const [dueDate, setDueDate] = useState(
    initialDueDate || new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    if (isOpen) {
      if (initialSubjectId) {
        setSubjectId(initialSubjectId);
      } else if (subjects.length > 0 && !subjectId) {
        setSubjectId(subjects[0]._id);
      }
      if (initialDueDate) {
        setDueDate(initialDueDate);
      }
    }
  }, [isOpen, initialSubjectId, initialDueDate, subjects]);
  const [dueTime, setDueTime] = useState('');
  const [status, setStatus] = useState<AcademyTaskStatus>('To Do');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline subject creation state
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubColor, setNewSubColor] = useState(PRESET_COLORS[0]);
  const [subLoading, setSubLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a task title');
      return;
    }
    if (!subjectId) {
      setError('Please select or create a subject');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.createAcademyTask({
        title,
        subjectId,
        dueDate,
        dueTime,
        status,
        notes,
      });
      onTaskCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubjectInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    try {
      setSubLoading(true);
      const created = await api.createAcademySubject({
        name: newSubName.trim(),
        color: newSubColor,
      });
      if (onSubjectCreated) onSubjectCreated(created);
      setSubjectId(created._id);
      setShowSubjectForm(false);
      setNewSubName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create subject');
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-lg p-5 sm:p-6 bg-slate-900/95 border-cyan-500/30 rounded-xl shadow-2xl relative animate-modal-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div>
            <p className="panel-label mb-0.5">The Academy</p>
            <h3 className="text-lg font-bold text-white tracking-wide">
              Add New Assignment / Task
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs rounded-lg bg-red-950/60 border border-red-500/40 text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitTask} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Task / Assignment Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Problem Set 4: Derivatives"
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">
                Subject *
              </label>
              <button
                type="button"
                onClick={() => setShowSubjectForm(!showSubjectForm)}
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                {showSubjectForm ? 'Select Existing' : '+ New Subject'}
              </button>
            </div>

            {showSubjectForm ? (
              <div className="p-3 rounded-lg bg-slate-950/90 border border-cyan-500/40 space-y-3">
                <input
                  type="text"
                  placeholder="Subject Name (e.g. Linear Algebra)"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
                <div>
                  <p className="text-[9px] uppercase text-slate-400 mb-1">
                    Subject Color
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewSubColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          newSubColor === c
                            ? 'border-white scale-110 shadow-md'
                            : 'border-transparent opacity-80'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCreateSubjectInline}
                  disabled={subLoading || !newSubName.trim()}
                  className="workout-bulk-btn w-full !py-1 text-xs"
                >
                  {subLoading ? 'Creating...' : 'Save Subject'}
                </button>
              </div>
            ) : (
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
              >
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    ● {sub.name} {sub.code ? `(${sub.code})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Due Time (Optional)
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AcademyTaskStatus)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Optional Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Chapter readings, links, submission instructions..."
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="workout-bulk-btn workout-bulk-btn-muted text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="journal-action-btn text-xs"
            >
              {loading ? 'Saving...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import type { Subject } from '@/types';
import { api } from '@/lib/api';

interface AddSubjectModalProps {
  isOpen: boolean;
  editingSubject?: Subject | null;
  onClose: () => void;
  onSubjectSaved: (subject: Subject) => void;
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

export default function AddSubjectModal({
  isOpen,
  editingSubject,
  onClose,
  onSubjectSaved,
}: AddSubjectModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingSubject) {
      setName(editingSubject.name);
      setCode(editingSubject.code || '');
      setColor(editingSubject.color || PRESET_COLORS[0]);
    } else {
      setName('');
      setCode('');
      setColor(PRESET_COLORS[0]);
    }
  }, [editingSubject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a subject name');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      let res: Subject;
      if (editingSubject) {
        // Edit
        res = await api.createAcademySubject({
          name: name.trim(),
          code: code.trim(),
          color,
        });
      } else {
        // Create
        res = await api.createAcademySubject({
          name: name.trim(),
          code: code.trim(),
          color,
        });
      }
      onSubjectSaved(res);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-md p-5 bg-slate-900/95 border-cyan-500/30 rounded-xl shadow-2xl relative animate-modal-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div>
            <p className="panel-label mb-0.5">The Academy</p>
            <h3 className="text-base font-bold text-white tracking-wide">
              {editingSubject ? 'Edit Subject' : '+ Add New Subject'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-2.5 mb-3 text-xs rounded bg-red-950/60 border border-red-500/40 text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Calculus, Data Structures"
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Course Code (Optional)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. MATH201, CS102"
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
              Subject Accent Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-transparent opacity-80'
                  }`}
                />
              ))}
            </div>
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
              {loading ? 'Saving...' : editingSubject ? 'Save Changes' : 'Create Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

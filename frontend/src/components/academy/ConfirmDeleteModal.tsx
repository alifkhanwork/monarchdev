'use client';

import { useEffect } from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  message?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  isOpen,
  title,
  itemName,
  message,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-sm p-5 bg-slate-900/95 border-red-500/40 rounded-xl shadow-2xl relative text-center space-y-3.5 animate-modal-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center mx-auto text-xl text-red-400 shadow-md shadow-red-950/50">
          ⚠️
        </div>

        <div>
          <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
          <p className="text-xs text-slate-300 mt-1">
            Are you sure you want to delete <span className="font-semibold text-white">&quot;{itemName}&quot;</span>?
          </p>
          {message && (
            <p className="text-[11px] text-red-400/90 mt-1 font-mono-data">
              {message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="workout-bulk-btn workout-bulk-btn-muted text-xs px-4 py-2"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all border border-red-400/40"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

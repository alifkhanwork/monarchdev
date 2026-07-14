'use client';

interface ActionToastProps {
  message: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
}

export default function ActionToast({
  message,
  detail,
  actionLabel,
  onAction,
  onDismiss,
}: ActionToastProps) {
  return (
    <div
      role="status"
      className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-1.5rem)] max-w-md animate-fade-in"
    >
      <div className="flex items-center gap-2 rounded-lg border border-cyan-500/35 bg-slate-950/95 backdrop-blur-md px-3 py-2.5 shadow-[0_0_24px_rgba(0,229,255,0.2)]">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-cyan-100 font-semibold leading-snug">{message}</p>
          {detail && <p className="text-meta mt-0.5 truncate">{detail}</p>}
        </div>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 text-[11px] uppercase tracking-wider font-bold px-2.5 py-1.5 rounded border border-amber-400/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 min-h-[36px]"
          >
            {actionLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-slate-500 hover:text-slate-300 w-8 h-8"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

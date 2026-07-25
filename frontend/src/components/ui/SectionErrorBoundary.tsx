'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface SectionErrorBoundaryProps {
  children: ReactNode;
  /** Short label for the failed section (shown in fallback). */
  label?: string;
  onRetry?: () => void;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

/** Isolates render failures so one broken section doesn't blank the whole page. */
export default class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[SectionErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`, error, info);
  }

  retry = () => {
    this.setState({ error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <SectionErrorFallback
          label={this.props.label}
          message={this.state.error.message}
          onRetry={this.retry}
        />
      );
    }
    return this.props.children;
  }
}

export function SectionErrorFallback({
  label = 'this section',
  message,
  onRetry,
}: {
  label?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="glass-panel text-center py-6 px-4 space-y-2 border border-red-500/25"
    >
      <p className="text-sm text-red-300 font-semibold">Couldn&apos;t load {label}</p>
      <p className="text-meta">
        {message
          ? message.slice(0, 120)
          : 'Network or server error — retry when ready.'}
      </p>
      {onRetry && (
        <button type="button" className="journal-action-btn mt-1" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

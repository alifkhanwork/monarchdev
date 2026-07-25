'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatJournalDateLabel } from '@/lib/journalStorage';

const PAGE = 15;

interface Entry {
  dateKey: string;
  text: string;
}

interface DiaryBrowseSectionProps {
  /** Open heatmap/journal editor for a day (keeps existing interaction). */
  onOpenDate?: (dateKey: string) => void;
}

export default function DiaryBrowseSection({ onOpenDate }: DiaryBrowseSectionProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [months, setMonths] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInitial = useCallback(async (month: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listJournals({
        limit: PAGE,
        month: month || undefined,
      });
      setEntries(res.entries);
      setHasMore(res.hasMore);
      setNextBefore(res.nextBefore);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load diary');
      setEntries([]);
      setHasMore(false);
      setNextBefore(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { months: m } = await api.listJournalMonths();
        if (!cancelled) setMonths(m);
      } catch {
        if (!cancelled) setMonths([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadInitial(monthFilter);
  }, [monthFilter, loadInitial]);

  const loadMore = async () => {
    if (!hasMore || !nextBefore || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await api.listJournals({
        limit: PAGE,
        before: nextBefore,
        month: monthFilter || undefined,
      });
      setEntries((prev) => {
        const seen = new Set(prev.map((e) => e.dateKey));
        return [...prev, ...res.entries.filter((e) => !seen.has(e.dateKey))];
      });
      setHasMore(res.hasMore);
      setNextBefore(res.nextBefore);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  };

  const formatMonthLabel = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-2.5">
      <div className="glass-panel !py-3 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="panel-label">Hunter Diary</p>
            <p className="text-meta mt-0.5">
              Past journal entries, newest first. Heatmap tap still opens a day to edit.
            </p>
          </div>
          <label className="flex items-center gap-2 text-meta shrink-0">
            <span className="uppercase tracking-wider text-[10px]">Month</span>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="text-[12px] bg-slate-950/70 border border-cyan-500/25 rounded px-2 py-1.5 text-cyan-200 min-h-[36px]"
              aria-label="Jump to month"
            >
              <option value="">All months</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel !py-8 text-center text-meta">Loading diary…</div>
      ) : error ? (
        <div className="glass-panel !py-4 text-center text-amber-300 text-sm">{error}</div>
      ) : entries.length === 0 ? (
        <div className="glass-panel !py-8 text-center text-meta">
          No journal entries yet{monthFilter ? ' for this month' : ''}. Save one from Overview or
          Daily Grind.
        </div>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.dateKey} className="glass-panel !py-3 !px-3 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-neon-teal font-mono-data">
                  {formatJournalDateLabel(entry.dateKey)}
                </p>
                {onOpenDate && (
                  <button
                    type="button"
                    className="journal-action-btn journal-action-btn-muted !min-h-[32px] !text-[11px]"
                    onClick={() => onOpenDate(entry.dateKey)}
                  >
                    Open / edit
                  </button>
                )}
              </div>
              <p className="text-[13px] text-slate-200 whitespace-pre-wrap leading-relaxed">
                {entry.text}
              </p>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            className="journal-action-btn"
            disabled={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore ? 'Loading…' : 'Load older entries'}
          </button>
        </div>
      )}
    </div>
  );
}

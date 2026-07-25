import { localDateKey } from './dateHelpers';
import { api } from './api';
import { LIMITS } from './inputValidation';

const JOURNALS_KEY = 'the-system-journals';
const LEGACY_JOURNAL_KEY = 'the-system-journal';
const LEGACY_DATE_KEY = 'the-system-journal-date';
const SYNC_FLAG_KEY = 'the-system-journals-synced-v1';

export function getTodayKey(): string {
  return localDateKey();
}

function readAllJournals(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(JOURNALS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeAllJournals(journals: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(JOURNALS_KEY, JSON.stringify(journals));
}

export function migrateLegacyJournal(): void {
  if (typeof window === 'undefined') return;
  const legacy = localStorage.getItem(LEGACY_JOURNAL_KEY);
  if (!legacy) return;

  const dateKey = localStorage.getItem(LEGACY_DATE_KEY) || getTodayKey();
  const journals = readAllJournals();
  if (!journals[dateKey]) {
    journals[dateKey] = legacy;
    writeAllJournals(journals);
  }
  localStorage.removeItem(LEGACY_JOURNAL_KEY);
  localStorage.removeItem(LEGACY_DATE_KEY);
}

/** Cache plaintext locally for snappy heatmap / offline read. Server is source of truth. */
function cacheJournal(dateKey: string, text: string): void {
  const journals = readAllJournals();
  if (text.trim()) journals[dateKey] = text;
  else delete journals[dateKey];
  writeAllJournals(journals);
}

export function loadJournalForDate(dateKey: string): string {
  migrateLegacyJournal();
  return readAllJournals()[dateKey] || '';
}

/** Async load — prefers API (decrypted), falls back to local cache. */
export async function fetchJournalForDate(dateKey: string): Promise<string> {
  migrateLegacyJournal();
  try {
    const res = await api.getJournal(dateKey);
    const text = res.text || '';
    if (text) cacheJournal(dateKey, text);
    return text;
  } catch {
    return loadJournalForDate(dateKey);
  }
}

export async function saveJournalForDate(dateKey: string, text: string): Promise<void> {
  migrateLegacyJournal();
  const trimmed = text.trim();
  if (trimmed.length > 0 && trimmed.length < LIMITS.journalMinChars) {
    throw new Error(`Journal must be at least ${LIMITS.journalMinChars} characters`);
  }
  if (trimmed.length > LIMITS.journalMaxChars) {
    throw new Error(`Journal must be at most ${LIMITS.journalMaxChars.toLocaleString()} characters`);
  }

  if (!trimmed) {
    cacheJournal(dateKey, '');
    return;
  }

  const saved = await api.saveJournal(dateKey, trimmed);
  cacheJournal(dateKey, saved.text || trimmed);
}

export function hasJournalForDate(dateKey: string): boolean {
  return loadJournalForDate(dateKey).trim().length >= LIMITS.journalMinChars;
}

export function formatJournalDateLabel(dateKey: string): string {
  return new Date(dateKey + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Upload localStorage journals to encrypted Mongo once.
 * Safe to call repeatedly — server skips dates that already exist.
 */
export async function syncLocalJournalsToServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  migrateLegacyJournal();
  if (localStorage.getItem(SYNC_FLAG_KEY) === '1') return;

  const entries = readAllJournals();
  const keys = Object.keys(entries);
  if (keys.length === 0) {
    localStorage.setItem(SYNC_FLAG_KEY, '1');
    return;
  }

  try {
    await api.syncLocalJournals(entries);
    localStorage.setItem(SYNC_FLAG_KEY, '1');
  } catch {
    // Retry next session if key missing / offline
  }
}

/** Local snapshot for export backup. */
export function peekAllLocalJournals(): Record<string, string> {
  migrateLegacyJournal();
  return readAllJournals();
}

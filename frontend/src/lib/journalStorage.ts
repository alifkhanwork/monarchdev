import { localDateKey } from './dateHelpers';

const JOURNALS_KEY = 'the-system-journals';
const LEGACY_JOURNAL_KEY = 'the-system-journal';
const LEGACY_DATE_KEY = 'the-system-journal-date';

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

export function loadJournalForDate(dateKey: string): string {
  migrateLegacyJournal();
  return readAllJournals()[dateKey] || '';
}

export function saveJournalForDate(dateKey: string, text: string): void {
  migrateLegacyJournal();
  const journals = readAllJournals();
  if (text.trim()) {
    journals[dateKey] = text;
  } else {
    delete journals[dateKey];
  }
  writeAllJournals(journals);
}

export function hasJournalForDate(dateKey: string): boolean {
  return loadJournalForDate(dateKey).trim().length >= 10;
}

export function formatJournalDateLabel(dateKey: string): string {
  return new Date(dateKey + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

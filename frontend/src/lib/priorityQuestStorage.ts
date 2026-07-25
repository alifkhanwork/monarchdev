const PIN_KEY = 'the-system-priority-quest-id';

export function loadPinnedQuestId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PIN_KEY);
}

export function savePinnedQuestId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (!id) localStorage.removeItem(PIN_KEY);
  else localStorage.setItem(PIN_KEY, id);
}

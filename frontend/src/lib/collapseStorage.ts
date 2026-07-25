/** Persist expand/collapse maps: true = collapsed. */

export function loadCollapseMap(storageKey: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveCollapseMap(storageKey: string, map: Record<string, boolean>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey, JSON.stringify(map));
}

/**
 * Build initial collapse state for section ids.
 * Saved prefs win; otherwise collapse everything except `defaultOpenId`.
 */
export function buildCollapseState(
  sectionIds: string[],
  saved: Record<string, boolean>,
  defaultOpenId: string | null
): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  for (const id of sectionIds) {
    if (Object.prototype.hasOwnProperty.call(saved, id)) {
      next[id] = Boolean(saved[id]);
    } else {
      next[id] = defaultOpenId == null ? true : id !== defaultOpenId;
    }
  }
  return next;
}

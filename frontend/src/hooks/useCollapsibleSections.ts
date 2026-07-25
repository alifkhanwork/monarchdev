'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadCollapseMap, saveCollapseMap } from '@/lib/collapseStorage';

/**
 * Collapse map: `true` = section body not rendered.
 * Pre-hydration / unknown ids default to collapsed (or only `defaultOpenId` open).
 */
export function useCollapsibleSections(
  storageKey: string,
  sectionIds: string[],
  defaultOpenId: string | null
) {
  const idsKey = sectionIds.join('\0');
  const [map, setMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (sectionIds.length === 0) return;

    let saved = loadCollapseMap(storageKey);

    // Recovery: if every saved flag is "expanded" (false), treat as uninitialized.
    // Quest Board should default to all collapsed; a fully-expanded map usually means
    // stale/inverted prefs from an earlier buggy pass, not an intentional choice.
    if (defaultOpenId == null) {
      const values = Object.values(saved);
      if (values.length > 0 && values.every((v) => v === false)) {
        saved = {};
      }
    }

    setMap((prev) => {
      const next: Record<string, boolean> = {};
      for (const id of sectionIds) {
        if (Object.prototype.hasOwnProperty.call(prev, id)) {
          next[id] = Boolean(prev[id]);
        } else if (Object.prototype.hasOwnProperty.call(saved, id)) {
          next[id] = Boolean(saved[id]);
        } else {
          next[id] = defaultOpenId == null ? true : id !== defaultOpenId;
        }
      }
      saveCollapseMap(storageKey, next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, idsKey]);

  const isCollapsed = useCallback(
    (id: string) => {
      if (!Object.prototype.hasOwnProperty.call(map, id)) {
        return defaultOpenId == null ? true : id !== defaultOpenId;
      }
      return Boolean(map[id]);
    },
    [map, defaultOpenId]
  );

  const toggle = useCallback(
    (id: string) => {
      setMap((prev) => {
        const wasCollapsed = Object.prototype.hasOwnProperty.call(prev, id)
          ? Boolean(prev[id])
          : defaultOpenId == null
            ? true
            : id !== defaultOpenId;

        const next: Record<string, boolean> = { ...prev, [id]: !wasCollapsed };

        for (const sid of sectionIds) {
          if (!Object.prototype.hasOwnProperty.call(next, sid)) {
            next[sid] = defaultOpenId == null ? true : sid !== defaultOpenId;
          }
        }

        saveCollapseMap(storageKey, next);
        return next;
      });
    },
    [storageKey, sectionIds, defaultOpenId]
  );

  return { isCollapsed, toggle };
}

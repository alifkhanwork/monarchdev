import { getTodayKey } from './journalStorage';

export type CustomQuestStat = 'strength' | 'intelligence' | 'perception' | 'vitality' | 'agility';

export interface CustomQuest {
  id: string;
  title: string;
  expReward: number;
  statModifier: CustomQuestStat;
  targetCount?: number;
  createdAt: string;
  dateKey: string;
  /** When true, quest reappears every day (unchecked) from the recurring store. */
  recurring?: boolean;
}

type Store = Record<string, CustomQuest[]>;
type CompletionStore = Record<string, string[]>;

const QUESTS_KEY = 'the-system-custom-quests';
const COMPLETED_KEY = 'the-system-custom-quest-completions';
const RECURRING_KEY = 'the-system-custom-quest-recurring';

function readStore(): Store {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(QUESTS_KEY) || '{}') as Store;
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  localStorage.setItem(QUESTS_KEY, JSON.stringify(store));
}

function readCompleted(): CompletionStore {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(COMPLETED_KEY) || '{}') as CompletionStore;
  } catch {
    return {};
  }
}

function writeCompleted(store: CompletionStore) {
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(store));
}

function readRecurring(): CustomQuest[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECURRING_KEY) || '[]') as CustomQuest[];
  } catch {
    return [];
  }
}

function writeRecurring(list: CustomQuest[]) {
  localStorage.setItem(RECURRING_KEY, JSON.stringify(list));
}

export function loadRecurringCustomQuests(): CustomQuest[] {
  return readRecurring();
}

export function loadCustomQuestsForDate(dateKey = getTodayKey()): CustomQuest[] {
  const recurring = readRecurring().map((q) => ({
    ...q,
    dateKey,
    recurring: true,
  }));
  const oneOffs = (readStore()[dateKey] || []).filter((q) => !q.recurring);
  return [...recurring, ...oneOffs];
}

export function addCustomQuest(
  input: Omit<CustomQuest, 'id' | 'createdAt' | 'dateKey'> & { recurring?: boolean },
  dateKey = getTodayKey()
): CustomQuest {
  const quest: CustomQuest = {
    ...input,
    title: String(input.title || '').trim().slice(0, 120),
    expReward: Math.max(1, Math.min(100, Number(input.expReward) || 1)),
    targetCount:
      input.targetCount == null || Number.isNaN(Number(input.targetCount))
        ? undefined
        : Math.max(1, Math.min(10_000, Number(input.targetCount))),
    recurring: Boolean(input.recurring),
    id: `cq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    dateKey,
  };

  if (quest.recurring) {
    writeRecurring([...readRecurring(), quest]);
    return quest;
  }

  const store = readStore();
  store[dateKey] = [...(store[dateKey] || []), quest];
  writeStore(store);
  return quest;
}

export function removeCustomQuest(id: string, dateKey = getTodayKey()) {
  const recurring = readRecurring().filter((q) => q.id !== id);
  if (recurring.length !== readRecurring().length) {
    writeRecurring(recurring);
  }
  const store = readStore();
  store[dateKey] = (store[dateKey] || []).filter((q) => q.id !== id);
  writeStore(store);
  // Keep completion marks — custom quests never award server EXP/stats.
}

export function updateCustomQuest(
  id: string,
  patch: Partial<
    Pick<CustomQuest, 'title' | 'expReward' | 'statModifier' | 'targetCount' | 'recurring'>
  >,
  dateKey = getTodayKey()
): CustomQuest | null {
  const applyPatch = (q: CustomQuest): CustomQuest => {
    const next: CustomQuest = {
      ...q,
      ...patch,
      title: patch.title != null ? patch.title.trim() : q.title,
      expReward:
        patch.expReward != null ? Math.max(1, Math.min(100, patch.expReward)) : q.expReward,
    };
    if (patch.targetCount !== undefined) {
      next.targetCount =
        patch.targetCount == null || Number.isNaN(Number(patch.targetCount))
          ? undefined
          : Math.max(1, Math.min(10_000, Number(patch.targetCount)));
    }
    if (patch.recurring !== undefined) {
      next.recurring = Boolean(patch.recurring);
    }
    return next;
  };

  const recurringList = readRecurring();
  const rIdx = recurringList.findIndex((q) => q.id === id);
  const oneOffStore = readStore();
  const dayList = oneOffStore[dateKey] || [];
  const oIdx = dayList.findIndex((q) => q.id === id);

  // Found in recurring store
  if (rIdx >= 0) {
    const updated = applyPatch(recurringList[rIdx]);
    if (updated.recurring) {
      recurringList[rIdx] = updated;
      writeRecurring(recurringList);
      return { ...updated, dateKey };
    }
    // Convert to one-off for today
    writeRecurring(recurringList.filter((q) => q.id !== id));
    const asOneOff = { ...updated, recurring: false, dateKey };
    oneOffStore[dateKey] = [...dayList.filter((q) => q.id !== id), asOneOff];
    writeStore(oneOffStore);
    return asOneOff;
  }

  // Found as one-off
  if (oIdx >= 0) {
    const updated = applyPatch(dayList[oIdx]);
    if (updated.recurring) {
      // Move into recurring store
      oneOffStore[dateKey] = dayList.filter((q) => q.id !== id);
      writeStore(oneOffStore);
      const asRecurring = { ...updated, recurring: true };
      writeRecurring([...readRecurring().filter((q) => q.id !== id), asRecurring]);
      return { ...asRecurring, dateKey };
    }
    dayList[oIdx] = updated;
    oneOffStore[dateKey] = dayList;
    writeStore(oneOffStore);
    return updated;
  }

  return null;
}

export function isCustomQuestCompleted(id: string, dateKey = getTodayKey()): boolean {
  return (readCompleted()[dateKey] || []).includes(id);
}

export function toggleCustomQuestCompleted(id: string, dateKey = getTodayKey()): boolean {
  const done = readCompleted();
  const list = new Set(done[dateKey] || []);
  if (list.has(id)) list.delete(id);
  else list.add(id);
  done[dateKey] = [...list];
  writeCompleted(done);
  return list.has(id);
}

export function loadAllCustomQuests(): Store {
  return readStore();
}

export function loadAllCustomCompletions(): CompletionStore {
  return readCompleted();
}

/** Lightweight optional rituals shown on Rest Days (local only). */
export const REST_DAY_RITUALS = [
  { id: 'rest_hydrate', title: 'Hydrate & stretch (10 min)', expNote: 'Optional' },
  { id: 'rest_walk', title: 'Easy walk or fresh air', expNote: 'Optional' },
  { id: 'rest_journal', title: 'One-line gratitude note', expNote: 'Optional' },
];

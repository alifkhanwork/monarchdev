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
}

type Store = Record<string, CustomQuest[]>;
type CompletionStore = Record<string, string[]>;

const QUESTS_KEY = 'the-system-custom-quests';
const COMPLETED_KEY = 'the-system-custom-quest-completions';

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

export function loadCustomQuestsForDate(dateKey = getTodayKey()): CustomQuest[] {
  return readStore()[dateKey] || [];
}

export function addCustomQuest(
  input: Omit<CustomQuest, 'id' | 'createdAt' | 'dateKey'>,
  dateKey = getTodayKey()
): CustomQuest {
  const quest: CustomQuest = {
    ...input,
    id: `cq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    dateKey,
  };
  const store = readStore();
  store[dateKey] = [...(store[dateKey] || []), quest];
  writeStore(store);
  return quest;
}

export function removeCustomQuest(id: string, dateKey = getTodayKey()) {
  const store = readStore();
  store[dateKey] = (store[dateKey] || []).filter((q) => q.id !== id);
  writeStore(store);
  const done = readCompleted();
  if (done[dateKey]) {
    done[dateKey] = done[dateKey].filter((x) => x !== id);
    writeCompleted(done);
  }
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

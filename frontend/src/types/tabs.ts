export type TabId = 'daily' | 'grind' | 'profile' | 'milestones' | 'settings';

export type GrindPeriod = 'weekly' | 'monthly';

export interface TabConfig {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

export const TABS: TabConfig[] = [
  {
    id: 'daily',
    label: 'The Daily Grind',
    shortLabel: 'Daily',
    icon: '⚔',
    description: "Execute today's quests",
  },
  {
    id: 'grind',
    label: 'The Grind',
    shortLabel: 'Grind',
    icon: '🛡',
    description: 'Recurring weekly & monthly goals',
  },
  {
    id: 'profile',
    label: 'Player Profile',
    shortLabel: 'Profile',
    icon: '◈',
    description: 'Stats & gear loadout',
  },
  {
    id: 'milestones',
    label: 'The Quest Board',
    shortLabel: 'Quests',
    icon: '★',
    description: 'Long-term milestones',
  },
  {
    id: 'settings',
    label: 'Settings',
    shortLabel: 'Settings',
    icon: '⚙',
    description: 'Units, week start & cosmetics',
  },
];

const GRIND_PERIOD_KEY = 'the-system-grind-period';

export function loadGrindPeriod(): GrindPeriod {
  if (typeof window === 'undefined') return 'weekly';
  const raw = localStorage.getItem(GRIND_PERIOD_KEY);
  return raw === 'monthly' ? 'monthly' : 'weekly';
}

export function saveGrindPeriod(period: GrindPeriod): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GRIND_PERIOD_KEY, period);
}

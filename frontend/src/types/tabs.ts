export type TabId = 'daily' | 'weekly' | 'monthly' | 'profile' | 'milestones';

export interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
  description: string;
}

export const TABS: TabConfig[] = [
  {
    id: 'daily',
    label: 'The Daily Grind',
    icon: '⚔',
    description: "Execute today's quests",
  },
  {
    id: 'weekly',
    label: 'Weekly Grind',
    icon: '🛡',
    description: 'Recurring weekly goals',
  },
  {
    id: 'monthly',
    label: 'Monthly Grind',
    icon: '◷',
    description: 'Recurring monthly goals',
  },
  {
    id: 'profile',
    label: 'Player Profile',
    icon: '◈',
    description: 'Stats & gear loadout',
  },
  {
    id: 'milestones',
    label: 'The Quest Board',
    icon: '★',
    description: 'Long-term milestones',
  },
];

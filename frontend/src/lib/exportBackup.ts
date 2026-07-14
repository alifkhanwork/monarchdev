import { loadAllCustomCompletions, loadAllCustomQuests } from './customQuestsStorage';
import { getTodayKey } from './journalStorage';
import type { User } from '@/types';

const JOURNALS_KEY = 'the-system-journals';

function readJournals(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(JOURNALS_KEY) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

/** Download a JSON backup of local + server-known hunter data. */
export function exportHunterBackup(user: User) {
  const payload = {
    exportedAt: new Date().toISOString(),
    todayKey: getTodayKey(),
    app: 'The Dev Monarch',
    player: {
      username: user.username,
      level: user.level,
      currentExp: user.currentExp,
      expToNextLevel: user.expToNextLevel,
      equippedTitle: user.equippedTitle,
      stats: user.stats,
      totalPower: user.totalPower,
      streak: user.streak,
      lifetimeStats: user.lifetimeStats,
      dayCompletionLog: user.dayCompletionLog || [],
      availableTitles: user.availableTitles,
    },
    journals: readJournals(),
    customQuests: loadAllCustomQuests(),
    customQuestCompletions: loadAllCustomCompletions(),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dev-monarch-backup-${getTodayKey()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

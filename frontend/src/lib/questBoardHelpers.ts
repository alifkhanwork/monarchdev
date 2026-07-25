/** Quest Board rank from EXP value (or SSR gear). */

export type QuestRank = 'S' | 'A' | 'B' | 'C';

export function questRankFromExp(expReward: number, isSSR = false): QuestRank {
  if (isSSR || expReward >= 1000) return 'S';
  if (expReward >= 500) return 'A';
  if (expReward >= 200) return 'B';
  return 'C';
}

export const QUEST_RANK_STYLES: Record<QuestRank, string> = {
  S: 'border-amber-500/55 bg-amber-900/35 text-amber-300',
  A: 'border-violet-500/50 bg-violet-900/30 text-violet-300',
  B: 'border-cyan-500/45 bg-cyan-900/30 text-cyan-300',
  C: 'border-slate-500/40 bg-slate-800/40 text-slate-300',
};

export function isMilestoneOverdue(
  targetDate: string | null | undefined,
  isCompleted: boolean
): boolean {
  if (!targetDate || isCompleted) return false;
  const due = new Date(targetDate);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

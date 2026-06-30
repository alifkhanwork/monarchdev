export function formatResetCountdown(ms: number): string {
  const totalHours = Math.floor(ms / 3600000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

export function computeTodayExp(
  tasks: { expReward: number; isCompleted: boolean }[]
): { earned: number; possible: number } {
  const possible = tasks.reduce((s, t) => s + t.expReward, 0);
  const earned = tasks.filter((t) => t.isCompleted).reduce((s, t) => s + t.expReward, 0);
  return { earned, possible };
}

/** System-voice flavor lines for quest feedback. */

export const QUEST_CLEARED_FLAVOR = [
  'Gate cleared.',
  'System notice: growth detected.',
  'Hunter status updated.',
  'Quest logged. Keep climbing.',
  'The System acknowledges your progress.',
  'Cleared. Momentum preserved.',
];

export const DAY_CLEARED_FLAVOR = [
  'Daily protocol complete. Rest well, Hunter.',
  'System notice: full clear recorded.',
  'All gates sealed for today.',
  'The Monarch’s path holds steady.',
];

export function pickFlavor(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)] ?? lines[0];
}

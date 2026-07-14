/** Rotating End-of-Day Journal prompts (pick by calendar day). */

export const JOURNAL_PROMPTS = [
  "What's one thing that went well today?",
  "What's one thing you'd do differently?",
  "What's tomorrow's #1 focus?",
  'Where did you protect your energy today?',
  'What skill did the grind sharpen?',
  'What would Shadow Monarch-you do next?',
  'Name one win worth locking into memory.',
  'What distraction almost won — and how did you push back?',
];

/** Stable daily prompt — same all day, rotates at midnight. */
export function getJournalPromptForDate(dateKey: string): string {
  const idx =
    dateKey.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % JOURNAL_PROMPTS.length;
  return JOURNAL_PROMPTS[idx];
}

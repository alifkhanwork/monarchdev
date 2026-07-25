/** First-visit onboarding — localStorage only. */

const ONBOARDING_KEY = 'the-system-onboarding-seen';

export const ONBOARDING_STEPS = [
  {
    title: 'EXP & Levels',
    body: 'Clear quests to earn EXP. Fill the bar to level up — your Hunter rank climbs with consistency, not perfection.',
  },
  {
    title: 'The Daily Grind',
    body: 'Today’s checklist: habits, workout, journal, and one-offs. This is the core loop you run every day.',
  },
  {
    title: 'The Grind vs Quest Board',
    body: 'The Grind tracks weekly & monthly Hunter Missions. The Quest Board holds long-term S-Rank gates and life goals.',
  },
  {
    title: 'Your Stats',
    body: 'STR (training), VIT (recovery & fuel), INT (study), PER (awareness & journaling), AGI/END (cardio & mobility). Gear multiplies them.',
  },
] as const;

export function hasSeenOnboarding(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(ONBOARDING_KEY) === '1';
}

export function markOnboardingSeen(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ONBOARDING_KEY, '1');
}

export function clearOnboardingSeen(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ONBOARDING_KEY);
}

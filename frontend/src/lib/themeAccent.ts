/** Theme accent payloads from the EXP shop → CSS variable RGB triples. */

export type ThemeAccentId = 'crimson' | 'violet' | null;

export const THEME_ACCENTS: Record<
  Exclude<ThemeAccentId, null>,
  { label: string; rgb: string; hex: string }
> = {
  crimson: { label: 'Crimson Edge', rgb: '251, 113, 133', hex: '#fb7185' },
  violet: { label: 'Violet Core', rgb: '167, 139, 250', hex: '#a78bfa' },
};

export const DEFAULT_ACCENT_RGB = '0, 229, 255';
export const DEFAULT_ACCENT_HEX = '#00e5ff';

export function applyThemeAccent(accent: string | null | undefined) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const key = accent === 'crimson' || accent === 'violet' ? accent : null;

  if (!key) {
    root.removeAttribute('data-accent');
    root.style.removeProperty('--neon-teal');
    root.style.removeProperty('--neon-teal-rgb');
    return;
  }

  const cfg = THEME_ACCENTS[key];
  root.setAttribute('data-accent', key);
  root.style.setProperty('--neon-teal', cfg.hex);
  root.style.setProperty('--neon-teal-rgb', cfg.rgb);
}

/** Weight display helpers — storage/API stay in kg; UI converts. */

export type WeightUnit = 'kg' | 'lbs';

const KG_TO_LBS = 2.2046226218;

export function kgToDisplay(kg: number, unit: WeightUnit): number {
  if (unit === 'lbs') return kg * KG_TO_LBS;
  return kg;
}

export function displayToKg(value: number, unit: WeightUnit): number {
  if (unit === 'lbs') return value / KG_TO_LBS;
  return value;
}

export function formatWeight(
  kg: number | null | undefined,
  unit: WeightUnit,
  opts?: { digits?: number; suffix?: boolean }
): string {
  if (kg == null || Number.isNaN(kg)) return '—';
  const digits = opts?.digits ?? (unit === 'lbs' ? 0 : 1);
  const n = kgToDisplay(kg, unit);
  const rounded =
    digits === 0 ? Math.round(n) : Math.round(n * 10 ** digits) / 10 ** digits;
  const body = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(digits);
  return opts?.suffix === false ? body : `${body} ${unit}`;
}

/** Common plate options shown in the logger, converted for the active unit. */
export function weightPresetsKg(): number[] {
  return [5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25];
}

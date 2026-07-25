/** App calendar timezone — keep in sync with backend APP_TIMEZONE (daily reset). */
export const APP_TIMEZONE = 'Asia/Manila';

/** YYYY-MM-DD in Asia/Manila (matches server daily rollover). */
export function localDateKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

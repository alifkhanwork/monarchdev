/**
 * All calendar-day logic uses APP_TIMEZONE (default Asia/Manila).
 * Daily quests reset at 00:00 in that zone on the next API hit after midnight.
 */
const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Manila';

/** Manila has no DST; used when constructing midnight instants. */
const MANILA_OFFSET = '+08:00';

const WEEKDAY_TO_INDEX = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const pad2 = (n) => String(n).padStart(2, '0');

/** YYYY-MM-DD in APP_TIMEZONE. */
const localDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));

/** 0 = Sunday … 6 = Saturday in APP_TIMEZONE. */
const getZonedWeekday = (date = new Date()) => {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    weekday: 'short',
  }).format(new Date(date));
  return WEEKDAY_TO_INDEX[name] ?? 0;
};

/**
 * Instant for 00:00:00 on the calendar day of `date` in APP_TIMEZONE.
 * Comparable across rollover checks (Date.getTime()).
 */
const startOfDay = (date = new Date()) => {
  const key = localDateKey(date);
  if (APP_TIMEZONE === 'Asia/Manila') {
    return new Date(`${key}T00:00:00${MANILA_OFFSET}`);
  }
  // Fallback: treat as +08 until other zones need a full offset resolver
  return new Date(`${key}T00:00:00${MANILA_OFFSET}`);
};

const addCalendarDays = (dateKey, deltaDays) => {
  const base = startOfDay(new Date(`${dateKey}T12:00:00${MANILA_OFFSET}`));
  const next = new Date(base.getTime() + deltaDays * 86400000);
  return localDateKey(next);
};

/** UL × PPL split with Wed/Sun recovery (Manila weekday). */
const getWorkoutDayType = (date = new Date()) => {
  switch (getZonedWeekday(date)) {
    case 1:
      return 'Upper';
    case 2:
      return 'Lower';
    case 3:
      return 'ActiveRecovery';
    case 4:
      return 'Push';
    case 5:
      return 'Pull';
    case 6:
      return 'Legs';
    case 0:
    default:
      return 'Recovery';
  }
};

const isSameDay = (dateA, dateB) => {
  if (!dateA || !dateB) return false;
  return localDateKey(dateA) === localDateKey(dateB);
};

const getWeekKey = (date = new Date()) => {
  const key = localDateKey(date);
  const weekday = getZonedWeekday(date);
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  const mondayKey = addCalendarDays(key, -daysFromMonday);
  const [yearStr, monthStr, dayStr] = mondayKey.split('-');
  const year = Number(yearStr);
  const monday = new Date(
    `${yearStr}-${monthStr}-${dayStr}T12:00:00${MANILA_OFFSET}`
  );
  const jan1 = new Date(`${year}-01-01T12:00:00${MANILA_OFFSET}`);
  const week = Math.ceil(((monday - jan1) / 86400000 + getZonedWeekday(jan1) + 1) / 7);
  return `${year}-W${pad2(week)}`;
};

const getMonthKey = (date = new Date()) => {
  const key = localDateKey(date);
  return key.slice(0, 7);
};

const getNextMonday = (date = new Date()) => {
  const key = localDateKey(date);
  const weekday = getZonedWeekday(date);
  const daysUntil = weekday === 0 ? 1 : 8 - weekday;
  const nextKey = addCalendarDays(key, daysUntil);
  return startOfDay(new Date(`${nextKey}T12:00:00${MANILA_OFFSET}`));
};

const getNextMonthStart = (date = new Date()) => {
  const key = localDateKey(date);
  const [y, m] = key.split('-').map(Number);
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  const nextKey = `${nextYear}-${pad2(nextMonth)}-01`;
  return startOfDay(new Date(`${nextKey}T12:00:00${MANILA_OFFSET}`));
};

/** Monday–Sunday date keys for the week containing `date` (Manila). */
const getWeekDateKeys = (date = new Date()) => {
  const key = localDateKey(date);
  const weekday = getZonedWeekday(date);
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  const startKey = addCalendarDays(key, -daysFromMonday);
  const endKey = addCalendarDays(startKey, 6);
  return { startKey, endKey };
};

/** 1st–last day date keys for the month containing `date` (Manila). */
const getMonthDateKeys = (date = new Date()) => {
  const key = localDateKey(date);
  const [y, m] = key.split('-').map(Number);
  const startKey = `${y}-${pad2(m)}-01`;
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  const nextStart = `${nextYear}-${pad2(nextMonth)}-01`;
  const endKey = addCalendarDays(nextStart, -1);
  return { startKey, endKey };
};

module.exports = {
  APP_TIMEZONE,
  getWorkoutDayType,
  isSameDay,
  startOfDay,
  getWeekKey,
  getMonthKey,
  getNextMonday,
  getNextMonthStart,
  localDateKey,
  getWeekDateKeys,
  getMonthDateKeys,
  getZonedWeekday,
};

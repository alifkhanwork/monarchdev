const getWorkoutDayType = (date = new Date()) => {
  const day = date.getDay();
  switch (day) {
    case 1:
      return 'UpperA'; // Monday — Back & Chest
    case 2:
      return 'LowerA'; // Tuesday — Quads & Lower Abs
    case 3:
    case 6:
      return 'ActiveRecovery'; // Wednesday & Saturday
    case 4:
      return 'UpperB'; // Thursday — Shoulders & Arms
    case 5:
      return 'LowerB'; // Friday — Hamstrings & Upper Abs
    case 0:
    default:
      return 'Rest'; // Sunday — Complete Rest / Mobility
  }
};

const isSameDay = (dateA, dateB) => {
  if (!dateA || !dateB) return false;
  const a = new Date(dateA);
  const b = new Date(dateB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getWeekKey = (date = new Date()) => {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  const year = monday.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const week = Math.ceil(((monday - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
};

const getMonthKey = (date = new Date()) => {
  const d = startOfDay(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getNextMonday = (date = new Date()) => {
  const d = startOfDay(date);
  const day = d.getDay();
  const daysUntil = day === 0 ? 1 : 8 - day;
  const next = new Date(d);
  next.setDate(d.getDate() + daysUntil);
  return next;
};

const getNextMonthStart = (date = new Date()) => {
  const d = startOfDay(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
};

const localDateKey = (date = new Date()) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Monday–Sunday local date keys for the week containing `date`. */
const getWeekDateKeys = (date = new Date()) => {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { startKey: localDateKey(monday), endKey: localDateKey(sunday) };
};

/** 1st–last day local date keys for the month containing `date`. */
const getMonthDateKeys = (date = new Date()) => {
  const d = startOfDay(date);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { startKey: localDateKey(start), endKey: localDateKey(end) };
};

module.exports = {
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
};

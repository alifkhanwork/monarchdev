const getWorkoutDayType = (date = new Date()) => {
  const day = date.getDay();
  switch (day) {
    case 1:
    case 4:
      return 'Upper';
    case 2:
    case 5:
      return 'Lower';
    case 0:
    case 3:
    case 6:
      return 'Rest';
    default:
      return 'Rest';
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

module.exports = {
  getWorkoutDayType,
  isSameDay,
  startOfDay,
  getWeekKey,
  getMonthKey,
  getNextMonday,
  getNextMonthStart,
};

const { startOfDay } = require('./dateHelpers');

const DAY_STATUSES = {
  normal: { label: 'Normal', badge: null },
  sick: { label: 'Sick Day', badge: '🩹 SICK DAY — Dailies Paused' },
  vacation: { label: 'Vacation', badge: '✈️ VACATION — Dailies Paused' },
  busy: { label: 'Busy (Work/School)', badge: '💼 BUSY (WORK/SCHOOL) — Dailies Paused' },
  rest: { label: 'Rest Day', badge: '😴 REST DAY — Dailies Paused' },
};

const FROZEN_STATUSES = ['sick', 'vacation', 'busy', 'rest'];
const VALID_STATUSES = Object.keys(DAY_STATUSES);

const getTodayKey = (date = new Date()) => startOfDay(date).toISOString().split('T')[0];

const isFrozenStatus = (status) => FROZEN_STATUSES.includes(status);

const getStatusForDate = (user, dateKey) => {
  if (user.todayDayStatus?.date === dateKey) {
    return user.todayDayStatus.status || 'normal';
  }
  const entry = (user.freezeHistory || []).find((f) => f.date === dateKey);
  return entry?.status || 'normal';
};

const ensureTodayStatus = (user) => {
  const todayKey = getTodayKey();
  if (!user.todayDayStatus || user.todayDayStatus.date !== todayKey) {
    user.todayDayStatus = { date: todayKey, status: 'normal' };
  }
  return user.todayDayStatus.status;
};

const setTodayStatus = (user, status) => {
  const todayKey = getTodayKey();
  user.todayDayStatus = { date: todayKey, status };
  return user.todayDayStatus;
};

const logFreezeDay = (user, dateKey, status) => {
  if (!isFrozenStatus(status)) return;
  if (!user.freezeHistory) user.freezeHistory = [];
  const exists = user.freezeHistory.some((f) => f.date === dateKey);
  if (!exists) {
    user.freezeHistory.unshift({
      date: dateKey,
      status,
      label: DAY_STATUSES[status]?.label || status,
    });
    if (user.freezeHistory.length > 30) {
      user.freezeHistory = user.freezeHistory.slice(0, 30);
    }
  }
};

const formatDayStatus = (status) => ({
  status,
  label: DAY_STATUSES[status]?.label || 'Normal',
  badge: DAY_STATUSES[status]?.badge || null,
  isFrozen: isFrozenStatus(status),
});

module.exports = {
  DAY_STATUSES,
  VALID_STATUSES,
  FROZEN_STATUSES,
  getTodayKey,
  isFrozenStatus,
  getStatusForDate,
  ensureTodayStatus,
  setTodayStatus,
  logFreezeDay,
  formatDayStatus,
};

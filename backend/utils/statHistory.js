const { calculateTotalPower } = require('./totalPower');
const { localDateKey } = require('./dateHelpers');

const STAT_KEYS = ['strength', 'intelligence', 'perception', 'vitality', 'agility'];

/**
 * Upsert a dated snapshot of stats + Total Power for trend charts.
 * Call after meaningful progress (quest complete, rollover, user fetch).
 */
const appendStatHistory = (user, date = new Date(), weapon = null, relic = null) => {
  if (!user.statHistory) user.statHistory = [];

  const dayKey = localDateKey(date);
  const equippedWeapon = weapon ?? user.equippedWeapon ?? null;
  const equippedRelic = relic ?? user.equippedRelic ?? null;
  const { totalPower } = calculateTotalPower(user, equippedWeapon, equippedRelic);

  const snapshot = {
    date: dayKey,
    stats: {
      strength: user.stats?.strength ?? 10,
      intelligence: user.stats?.intelligence ?? 10,
      perception: user.stats?.perception ?? 10,
      vitality: user.stats?.vitality ?? 10,
      agility: user.stats?.agility ?? 10,
    },
    totalPower,
    level: user.level || 1,
    currentExp: user.currentExp || 0,
  };

  const existing = user.statHistory.find((e) => e.date === dayKey);
  if (existing) {
    existing.stats = snapshot.stats;
    existing.totalPower = snapshot.totalPower;
    existing.level = snapshot.level;
    existing.currentExp = snapshot.currentExp;
  } else {
    user.statHistory.push(snapshot);
  }

  user.statHistory.sort((a, b) => a.date.localeCompare(b.date));
  // Keep ~2 months for Performance Overview
  if (user.statHistory.length > 60) {
    user.statHistory = user.statHistory.slice(-60);
  }
};

module.exports = { appendStatHistory, STAT_KEYS, localDateKey };

const STAT_KEYS = ['strength', 'intelligence', 'perception', 'vitality', 'agility'];

const appendStatHistory = (user, date = new Date()) => {
  if (!user.statHistory) user.statHistory = [];

  const dayKey = date.toISOString().split('T')[0];
  const existing = user.statHistory.find((e) => e.date === dayKey);

  const snapshot = {
    date: dayKey,
    stats: {
      strength: user.stats.strength,
      intelligence: user.stats.intelligence,
      perception: user.stats.perception,
      vitality: user.stats.vitality,
      agility: user.stats.agility ?? 10,
    },
  };

  if (existing) {
    existing.stats = snapshot.stats;
  } else {
    user.statHistory.push(snapshot);
  }

  user.statHistory.sort((a, b) => a.date.localeCompare(b.date));
  if (user.statHistory.length > 14) {
    user.statHistory = user.statHistory.slice(-14);
  }
};

module.exports = { appendStatHistory, STAT_KEYS };

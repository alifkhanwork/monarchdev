const STAT_MULTIPLIERS = {
  strength: 1.0,
  intelligence: 1.1,
  perception: 1.05,
  vitality: 1.0,
  agility: 1.05,
};

const calculateExpReward = (baseExp, statModifier) => {
  const multiplier = STAT_MULTIPLIERS[statModifier] || 1.0;
  return Math.round(baseExp * multiplier);
};

const expRequiredForLevel = (level) => Math.floor(100 * Math.pow(1.25, level - 1));

const applyExpAndLevelUp = (user, expGained) => {
  user.currentExp += expGained;
  if (user.spendableExp == null) user.spendableExp = 0;
  user.spendableExp += Math.max(0, expGained);
  const levelUps = [];

  while (user.currentExp >= user.expToNextLevel) {
    user.currentExp -= user.expToNextLevel;
    user.level += 1;
    user.expToNextLevel = expRequiredForLevel(user.level);
    levelUps.push(user.level);
  }

  return levelUps;
};

/** Ensure Best streak is never below Current (repairs drift / display bugs). */
const normalizeStreaks = (user) => {
  const current = user.currentStreak || 0;
  const best = user.bestStreak || 0;
  if (current > best) {
    user.bestStreak = current;
  }
  return {
    current: user.currentStreak || 0,
    best: Math.max(user.bestStreak || 0, user.currentStreak || 0),
  };
};

/**
 * Apply a day outcome to streak counters (pure aside from mutating user).
 * @param {'complete'|'incomplete'|'frozen'} outcome
 */
const applyStreakForDayOutcome = (user, outcome) => {
  if (outcome === 'frozen') {
    // Frozen days preserve the current streak
    return normalizeStreaks(user);
  }
  if (outcome === 'complete') {
    user.currentStreak = (user.currentStreak || 0) + 1;
    user.bestStreak = Math.max(user.bestStreak || 0, user.currentStreak);
  } else {
    user.currentStreak = 0;
  }
  return normalizeStreaks(user);
};

const incrementStat = (user, statModifier, amount = 1) => {
  if (user.stats[statModifier] !== undefined) {
    user.stats[statModifier] += amount;
  }
};

const decrementStat = (user, statModifier, amount = 1) => {
  if (user.stats[statModifier] !== undefined) {
    user.stats[statModifier] = Math.max(1, user.stats[statModifier] - amount);
  }
};

const revertExpAndLevelDown = (user, expLost) => {
  const levelDowns = [];
  user.currentExp -= expLost;

  while (user.currentExp < 0 && user.level > 1) {
    user.level -= 1;
    user.expToNextLevel = expRequiredForLevel(user.level);
    user.currentExp += user.expToNextLevel;
    levelDowns.push(user.level);
  }

  if (user.currentExp < 0) {
    user.currentExp = 0;
  }

  return levelDowns;
};

module.exports = {
  calculateExpReward,
  applyExpAndLevelUp,
  revertExpAndLevelDown,
  incrementStat,
  decrementStat,
  expRequiredForLevel,
  normalizeStreaks,
  applyStreakForDayOutcome,
  STAT_MULTIPLIERS,
};

const STAT_KEYS = ['strength', 'intelligence', 'perception', 'vitality', 'agility'];

const applyGearMultipliers = (baseStats, weapon, relic) => {
  const effective = { ...baseStats };

  for (const key of STAT_KEYS) {
    let value = baseStats[key] || 0;
    if (weapon?.statMultiplier?.[key]) {
      value = Math.round(value * weapon.statMultiplier[key]);
    }
    if (relic?.statMultiplier?.[key]) {
      value = Math.round(value * relic.statMultiplier[key]);
    }
    effective[key] = value;
  }

  return effective;
};

const calculateTotalPower = (user, weapon = null, relic = null) => {
  const baseStats = user.stats?.toObject?.() ?? user.stats ?? {};
  const effectiveStats = applyGearMultipliers(baseStats, weapon, relic);
  const statSum = STAT_KEYS.reduce((sum, key) => sum + (effectiveStats[key] || 0), 0);
  const levelBonus = (user.level || 1) * 50;

  return {
    totalPower: statSum * 10 + levelBonus,
    effectiveStats,
    baseStats,
  };
};

module.exports = {
  STAT_KEYS,
  applyGearMultipliers,
  calculateTotalPower,
};

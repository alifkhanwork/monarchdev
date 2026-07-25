const {
  calculateExpReward,
  applyExpAndLevelUp,
  revertExpAndLevelDown,
  incrementStat,
  decrementStat,
  expRequiredForLevel,
  normalizeStreaks,
  applyStreakForDayOutcome,
} = require('../gameLogic');

function makeUser(overrides = {}) {
  return {
    level: 1,
    currentExp: 0,
    expToNextLevel: 100,
    spendableExp: 0,
    currentStreak: 0,
    bestStreak: 0,
    stats: {
      strength: 10,
      intelligence: 10,
      perception: 10,
      vitality: 10,
      agility: 10,
    },
    ...overrides,
  };
}

describe('calculateExpReward', () => {
  test('applies stat multipliers for normal completion', () => {
    expect(calculateExpReward(40, 'strength')).toBe(40);
    expect(calculateExpReward(40, 'intelligence')).toBe(44);
    expect(calculateExpReward(40, 'perception')).toBe(42);
  });

  test('falls back to 1.0 for unknown modifiers', () => {
    expect(calculateExpReward(25, 'unknown')).toBe(25);
  });
});

describe('applyExpAndLevelUp / revertExpAndLevelDown', () => {
  test('awards EXP and levels up when threshold crossed', () => {
    const user = makeUser({ currentExp: 80, expToNextLevel: 100 });
    const ups = applyExpAndLevelUp(user, 40);
    expect(ups).toEqual([2]);
    expect(user.level).toBe(2);
    expect(user.currentExp).toBe(20);
    expect(user.expToNextLevel).toBe(expRequiredForLevel(2));
    expect(user.spendableExp).toBe(40);
  });

  test('undo/reversal subtracts EXP and can level down', () => {
    const user = makeUser({
      level: 2,
      currentExp: 20,
      expToNextLevel: expRequiredForLevel(2),
      spendableExp: 40,
    });
    const downs = revertExpAndLevelDown(user, 40);
    expect(downs).toContain(1);
    expect(user.level).toBe(1);
    expect(user.currentExp).toBeGreaterThanOrEqual(0);
  });

  test('reversal never drives level below 1 or EXP below 0', () => {
    const user = makeUser({ level: 1, currentExp: 10 });
    revertExpAndLevelDown(user, 999);
    expect(user.level).toBe(1);
    expect(user.currentExp).toBe(0);
  });
});

describe('stat point accumulation', () => {
  test('incrementStat adds points on completion', () => {
    const user = makeUser();
    incrementStat(user, 'strength', 2);
    expect(user.stats.strength).toBe(12);
  });

  test('decrementStat floors at 1 on undo', () => {
    const user = makeUser({ stats: { strength: 2, intelligence: 10, perception: 10, vitality: 10, agility: 10 } });
    decrementStat(user, 'strength', 5);
    expect(user.stats.strength).toBe(1);
  });
});

describe('streak calculation', () => {
  test('completion continues the streak and raises best', () => {
    const user = makeUser({ currentStreak: 3, bestStreak: 3 });
    const result = applyStreakForDayOutcome(user, 'complete');
    expect(result.current).toBe(4);
    expect(result.best).toBe(4);
  });

  test('incomplete day breaks current streak but keeps best', () => {
    const user = makeUser({ currentStreak: 5, bestStreak: 8 });
    const result = applyStreakForDayOutcome(user, 'incomplete');
    expect(result.current).toBe(0);
    expect(result.best).toBe(8);
  });

  test('frozen day preserves current streak (freeze usage)', () => {
    const user = makeUser({ currentStreak: 6, bestStreak: 6 });
    const result = applyStreakForDayOutcome(user, 'frozen');
    expect(result.current).toBe(6);
    expect(result.best).toBe(6);
  });

  test('best streak is never below current (normalize repair)', () => {
    const user = makeUser({ currentStreak: 12, bestStreak: 4 });
    const result = normalizeStreaks(user);
    expect(user.bestStreak).toBe(12);
    expect(result.best).toBe(12);
    expect(result.current).toBe(12);
  });

  test('first completion after a break restarts at 1', () => {
    const user = makeUser({ currentStreak: 0, bestStreak: 10 });
    applyStreakForDayOutcome(user, 'complete');
    expect(user.currentStreak).toBe(1);
    expect(user.bestStreak).toBe(10);
  });
});

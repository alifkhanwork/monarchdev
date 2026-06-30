const RANK_LADDER = [
  { name: 'Novice Hunter', level: 1, totalPower: 0 },
  { name: 'Aspiring Shadow', level: 5, totalPower: 800 },
  { name: 'Disciplined Warrior', level: 10, totalPower: 2000 },
  { name: 'Elite Hunter', level: 15, totalPower: 4000 },
  { name: 'Shadow Monarch', level: 20, totalPower: 8000 },
];

const getNextRank = (level, totalPower) => {
  let currentRankIndex = 0;
  for (let i = 0; i < RANK_LADDER.length; i++) {
    if (level >= RANK_LADDER[i].level && totalPower >= RANK_LADDER[i].totalPower) {
      currentRankIndex = i;
    }
  }
  return RANK_LADDER[currentRankIndex + 1] || null;
};

module.exports = { RANK_LADDER, getNextRank };

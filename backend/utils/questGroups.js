/** Shared Quest Board UI group inference (must match frontend QuestBoardTab). */

function inferQuestGroup(title) {
  const t = String(title || '').toLowerCase();
  if (/license|job|credit|debt|budget|fund|invest|retirement|pay/.test(t)) {
    return 'Career & Finance';
  }
  if (/cook|dentist|checkup|blood|cpr|sleep|health/.test(t)) {
    return 'Health & Vitality';
  }
  return 'Personal Growth';
}

module.exports = { inferQuestGroup };

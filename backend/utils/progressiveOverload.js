/**
 * Intelligent Progressive Overload — double progression coach.
 * Training start: 2026-07-27 = Week 1 Day 1.
 */

const TRAINING_START = new Date(2026, 6, 27); // July 27, 2026 local
const AVAILABLE_WEIGHTS = [5, 7.5, 10, 12.5, 15];
const MAX_DB_WEIGHT = 15;

const BODYWEIGHT_KEYWORDS = [
  'pull-up',
  'chin-up',
  'push-up',
  'pike',
  'diamond',
  'leg raise',
  'knee raise',
  'hollow',
  'plank',
  'jump squat',
  'russian twist',
];

const VARIATION_LADDERS = {
  'Decline Push-ups': [
    'Decline Push-ups',
    'Feet-Elevated Pike Push-ups',
    'Archer Push-ups',
    'Pseudo Planche Push-ups',
  ],
  'Standard Push-ups': [
    'Standard Push-ups',
    'Feet Elevated Push-ups',
    'Decline Push-ups',
    'Archer Push-ups',
    'Pseudo Planche Push-ups',
  ],
  'Wide-Grip Pull-ups': [
    'Wide-Grip Pull-ups',
    'Weighted Pull-ups (future)',
    'L-Sit Pull-ups',
  ],
  'Chin-ups': ['Chin-ups', 'Weighted Chin-ups (future)', 'L-Sit Chin-ups'],
  'Diamond Push-ups': ['Diamond Push-ups', 'Pseudo Planche Push-ups'],
  'Feet-Elevated Pike Push-ups': [
    'Feet-Elevated Pike Push-ups',
    'Handstand Push-up Negatives',
    'Wall Handstand Push-ups',
  ],
  'Hanging Leg Raises': ['Hanging Leg Raises', 'Toes-to-Bar', 'Windshield Wipers'],
  'Hanging Knee Raises': ['Hanging Knee Raises', 'Hanging Leg Raises', 'Toes-to-Bar'],
};

const parseRepRange = (range = '') => {
  const s = String(range);
  if (/amrap/i.test(s)) return { min: 1, max: 12, amrap: true };
  if (/sec/i.test(s)) {
    const n = Number((s.match(/\d+/) || [30])[0]);
    return { min: n, max: n, amrap: false, isometric: true };
  }
  if (/step/i.test(s)) return { min: 0, max: 0, amrap: false, steps: true };
  const nums = s.match(/\d+/g);
  if (!nums?.length) return { min: 8, max: 12, amrap: false };
  if (nums.length === 1) return { min: Number(nums[0]), max: Number(nums[0]), amrap: false };
  return { min: Number(nums[0]), max: Number(nums[1]), amrap: false };
};

const classifyModality = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('step')) return 'steps';
  if (n.includes('cardio') || n.includes('walk') || n.includes('jog')) return 'cardio';
  if (n.includes('stretch') || n.includes('mobility') || n.includes('recovery')) return 'mobility';
  if (BODYWEIGHT_KEYWORDS.some((k) => n.includes(k))) return 'bodyweight';
  if (n.includes('db') || n.includes('dumbbell') || n.includes('goblet') || n.includes('curl') || n.includes('press') || n.includes('row') || n.includes('rdl') || n.includes('raise') || n.includes('fly') || n.includes('extension') || n.includes('lunge') || n.includes('squat')) {
    // Many of these can be BW or DB — prefer dumbbell if name implies load or default DB
    if (/bodyweight/i.test(n) && !/db|dumbbell|goblet|holding/i.test(n)) return 'bodyweight';
    return 'dumbbell';
  }
  return 'bodyweight';
};

const nextWeightUp = (current) => {
  const idx = AVAILABLE_WEIGHTS.findIndex((w) => w >= current - 0.01);
  if (idx < 0) return AVAILABLE_WEIGHTS[0];
  if (idx >= AVAILABLE_WEIGHTS.length - 1) return MAX_DB_WEIGHT;
  const at = AVAILABLE_WEIGHTS[idx];
  if (Math.abs(at - current) < 0.01) {
    return AVAILABLE_WEIGHTS[Math.min(idx + 1, AVAILABLE_WEIGHTS.length - 1)];
  }
  return at;
};

const trainingWeekNumber = (date = new Date()) => {
  const start = new Date(TRAINING_START);
  start.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (d < start) return 0;
  const diffDays = Math.floor((d - start) / 86400000);
  return Math.floor(diffDays / 7) + 1;
};

const isBeginnerPhase = (date = new Date()) => {
  const w = trainingWeekNumber(date);
  return w <= 4; // Weeks 0–4: pre-start + first month form-first
};

const scoreSession = (sets, { min, max, amrap }) => {
  if (!sets?.length) return { allMax: false, allMin: false, belowMin: true, avg: 0 };
  const allMax = sets.every((r) => r >= max);
  const allMin = sets.every((r) => r >= min);
  const belowMin = sets.some((r) => r < min);
  const avg = sets.reduce((a, b) => a + b, 0) / sets.length;
  return { allMax, allMin, belowMin, avg, amrap: Boolean(amrap) };
};

const performanceImproved = (prevSets = [], nextSets = []) => {
  if (!prevSets.length || !nextSets.length) return true;
  const prevTotal = prevSets.reduce((a, b) => a + b, 0);
  const nextTotal = nextSets.reduce((a, b) => a + b, 0);
  if (nextTotal > prevTotal) return true;
  // pairwise: at least half the sets improved
  let better = 0;
  const len = Math.min(prevSets.length, nextSets.length);
  for (let i = 0; i < len; i++) if (nextSets[i] > prevSets[i]) better++;
  return better >= Math.ceil(len / 2);
};

const evaluateExercise = ({
  exerciseName,
  modality,
  weightKg,
  targetSets,
  repRange,
  performedSets,
  progressDoc,
  date = new Date(),
}) => {
  const range = parseRepRange(repRange);
  const score = scoreSession(performedSets, range);
  const beginner = isBeginnerPhase(date);
  const week = trainingWeekNumber(date);
  const stage = progressDoc?.progressStage || 'load';
  const currentW = weightKg ?? progressDoc?.currentWeightKg ?? null;

  let verdict = 'maintain';
  let recommendation = '';
  let nextWeight = currentW;
  let nextStage = stage;
  let coachTips = [];

  if (modality === 'cardio' || modality === 'mobility' || modality === 'steps') {
    return {
      verdict: 'skip',
      recommendation: 'Recovery / cardio logged — keep consistency.',
      nextWeight: null,
      nextStage: stage,
      ratingContribution: score.belowMin ? 2 : 4,
      coachTips: [],
    };
  }

  if (range.isometric) {
    if (score.allMax) {
      verdict = 'progress';
      recommendation = 'Hold time hit — next session add +5–10 sec or a harder variation.';
      nextStage = stage === 'load' ? 'sets' : stage;
    } else if (score.belowMin) {
      verdict = 'practice';
      recommendation = 'Build toward the full hold time with good bracing.';
    } else {
      recommendation = 'Stay the course — hit the full duration on all sets.';
    }
  } else if (modality === 'dumbbell') {
    if (score.allMax && !beginner) {
      if (currentW != null && currentW < MAX_DB_WEIGHT - 0.01) {
        verdict = 'progress';
        nextWeight = nextWeightUp(currentW);
        recommendation = `All sets hit ${range.max} — increase to ${nextWeight} kg next session.`;
        nextStage = 'load';
      } else if (currentW != null && currentW >= MAX_DB_WEIGHT - 0.01) {
        verdict = 'progress';
        nextStage = advanceStage(stage, 'dumbbell', exerciseName);
        recommendation = stageAdvice(exerciseName, nextStage, range, targetSets, currentW);
      } else {
        verdict = 'progress';
        nextStage = advanceStage(stage, 'dumbbell', exerciseName);
        recommendation = stageAdvice(exerciseName, nextStage, range, targetSets, currentW);
      }
    } else if (score.allMax && beginner) {
      verdict = 'maintain';
      recommendation =
        week <= 4
          ? `Great session — Weeks 1–4 prioritize form. Stay at ${currentW ?? 'current'} kg one more week before loading up.`
          : `Ready soon — confirm one more clean session at ${range.max} reps.`;
      coachTips.push('Beginner phase: earn the right to add weight with consistent technique.');
    } else if (score.belowMin) {
      verdict = 'practice';
      recommendation = `Missed the ${range.min}-rep floor — keep ${currentW ?? 'current'} kg and rebuild.`;
    } else {
      verdict = 'maintain';
      recommendation = `Stay at ${currentW ?? 'current'} kg until every set hits ${range.max}.`;
    }
  } else {
    // bodyweight
    if (score.allMax && !beginner) {
      verdict = 'progress';
      nextStage = advanceStage(stage, 'bodyweight', exerciseName);
      recommendation = stageAdvice(exerciseName, nextStage, range, targetSets, null);
    } else if (score.allMax && beginner) {
      verdict = 'maintain';
      recommendation = 'Solid reps — lock in form for Weeks 1–4 before advancing variations.';
    } else if (score.belowMin) {
      verdict = 'practice';
      recommendation = 'Focus on quality reps to the minimum target before progressing.';
    } else {
      verdict = 'maintain';
      recommendation = `Stay on this variation until all sets reach ${range.max}${range.amrap ? '+ (strong AMRAP)' : ''}.`;
    }
  }

  // Plateau: last 3–5 sessions no improvement
  const recent = progressDoc?.recentSessions || [];
  if (recent.length >= 3) {
    const lastFew = recent.slice(-4);
    const stagnant = lastFew.every(
      (s, i, arr) => i === 0 || !performanceImproved(arr[i - 1].sets, s.sets)
    );
    if (stagnant && verdict !== 'progress') {
      verdict = 'plateau';
      coachTips.push(
        ...[
          'Consider an extra rest day or slightly longer rest between sets.',
          'Check sleep and protein — recovery drives progression.',
          'Optional deload week: cut volume ~40% then rebuild.',
          'Slow the eccentric (3–5 sec) to create new stimulus without more weight.',
          'Try a close variation to break the stall.',
        ].slice(0, 3)
      );
      recommendation =
        recommendation + ' Plateau signals detected — see coaching suggestions.';
    }
  }

  return {
    verdict,
    recommendation,
    nextWeight,
    nextStage,
    ratingContribution:
      verdict === 'progress' ? 5 : verdict === 'maintain' ? 4 : verdict === 'practice' ? 2 : 3,
    coachTips,
    range,
  };
};

const advanceStage = (stage, modality = 'dumbbell', name = '') => {
  const isBW = modality === 'bodyweight' || /pull-up|chin-up|push-up|pike|diamond|dip/i.test(name);
  const order = isBW
    ? ['load', 'reps', 'eccentric', 'pause', 'density', 'weighted_bodyweight', 'failure', 'variation']
    : ['load', 'reps', 'eccentric', 'pause', 'density', 'failure', 'variation'];
  const i = order.indexOf(stage);
  if (i < 0) return 'eccentric';
  if (i >= order.length - 1) return 'variation';
  return order[i + 1];
};

const stageAdvice = (name, stage, range, sets, weightKg) => {
  const isBW = /pull-up|chin-up|push-up|pike|diamond|dip|leg raise/i.test(name);
  const wStr = weightKg != null ? `${weightKg}kg` : 'bodyweight';

  switch (stage) {
    case 'eccentric':
      return `${name}: maxed at ${wStr} — try a 3–4 sec slow eccentric lowering phase next time.`;
    case 'pause':
      return `${name}: slow eccentrics hit — add a 1–2 sec pause at the hardest point of each rep next time.`;
    case 'density':
      return `${name}: pause reps solid — trim rest between sets by ~15–30s to increase density next time.`;
    case 'weighted_bodyweight':
      return isBW
        ? `${name}: exceeding 12–15 reps easily — add load (DB between feet or in a backpack) next session.`
        : `${name}: density goal reached — push sets closer to true failure (0–1 RIR) next time.`;
    case 'failure':
      return `${name}: maxed at ${wStr} and top of rep range — push sets closer to true failure (0–1 RIR) before advancing variation.`;
    case 'variation': {
      const ladder = VARIATION_LADDERS[name];
      if (ladder?.length > 1) {
        return `${name}: mechanism progression complete — advance to a harder variation (${ladder.slice(1, 3).join(' → ')}).`;
      }
      return `${name}: mechanism progression complete — move to a harder variation of this movement.`;
    }
    default:
      return `${name}: continue solid double progression — earn every increase.`;
  }
};

const defaultStartingWeight = (exerciseName, modality) => {
  if (modality !== 'dumbbell') return null;
  const n = exerciseName.toLowerCase();
  if (n.includes('lateral') || n.includes('rear delt') || n.includes('curl') || n.includes('extension') || n.includes('fly')) {
    return 5;
  }
  if (n.includes('press') || n.includes('row') || n.includes('rdl') || n.includes('goblet') || n.includes('lunge') || n.includes('split')) {
    return 10;
  }
  return 7.5;
};

const buildCoachSummary = (evaluations) => {
  const scored = evaluations.filter((e) => e.verdict !== 'skip');
  const avg =
    scored.length === 0
      ? 3
      : scored.reduce((s, e) => s + e.ratingContribution, 0) / scored.length;
  const rating = Math.max(1, Math.min(5, Math.round(avg)));

  const progress = scored.filter((e) => e.verdict === 'progress');
  const practice = scored.filter((e) => e.verdict === 'practice');
  const plateau = scored.filter((e) => e.verdict === 'plateau');

  let headline = 'Solid hunter session — stay consistent.';
  if (progress.length >= Math.ceil(scored.length / 2)) {
    headline = 'Ready to Progress — several lifts earned the next step.';
  } else if (practice.length > progress.length) {
    headline = 'Need More Practice — lock in the rep floor before loading up.';
  } else if (plateau.length) {
    headline = 'Plateau Watch — smart adjustments will keep gains coming.';
  }

  const notes = [];
  for (const e of scored) {
    notes.push(`${e.exerciseName}: ${e.recommendation}`);
  }
  const tips = [...new Set(scored.flatMap((e) => e.coachTips || []))].slice(0, 4);

  return { rating, headline, notes, tips, progress, practice, plateau, maintain: scored.filter((e) => e.verdict === 'maintain') };
};

module.exports = {
  TRAINING_START,
  AVAILABLE_WEIGHTS,
  MAX_DB_WEIGHT,
  VARIATION_LADDERS,
  parseRepRange,
  classifyModality,
  nextWeightUp,
  trainingWeekNumber,
  isBeginnerPhase,
  evaluateExercise,
  defaultStartingWeight,
  buildCoachSummary,
};

/** Canonical workout-of-the-day routines by weekday (UL × PPL + recovery). */

const WORKOUT_ROUTINES = [
  {
    dayType: 'Push',
    exercises: [
      { name: 'Pike Push-ups', sets: 4, repRange: '8–12', category: 'Shoulders' },
      { name: 'DB Floor Press', sets: 4, repRange: '12–15', category: 'Chest' },
      { name: 'Standing DB Shoulder Press', sets: 4, repRange: '10–12', category: 'Shoulders' },
      { name: 'DB Floor Fly', sets: 3, repRange: '12–15', category: 'Chest' },
      { name: 'Close-Grip/Diamond Push-ups', sets: 3, repRange: 'AMRAP', category: 'Triceps' },
      { name: 'DB Overhead Triceps Extension (two-hand)', sets: 3, repRange: '12–15', category: 'Triceps' },
      {
        name: 'Cardio (45 min) — 2 min brisk walk / 1 min easy jog',
        sets: 1,
        repRange: '45 min',
        category: 'Cardio',
      },
    ],
  },
  {
    dayType: 'Pull',
    exercises: [
      { name: 'Pull-ups (wide or neutral grip)', sets: 4, repRange: 'AMRAP', category: 'Back' },
      { name: 'Chin-ups (underhand)', sets: 3, repRange: 'AMRAP', category: 'Back' },
      { name: 'Single-Arm DB Row', sets: 4, repRange: '10–12/side', category: 'Back' },
      { name: 'DB Renegade Row', sets: 3, repRange: '8–10/side', category: 'Back' },
      { name: 'DB Bicep Curl', sets: 3, repRange: '12–15', category: 'Biceps' },
      { name: 'DB Hammer Curl', sets: 3, repRange: '12–15', category: 'Biceps' },
      {
        name: 'Cardio (45 min) — 2 min brisk walk / 1 min easy jog',
        sets: 1,
        repRange: '45 min',
        category: 'Cardio',
      },
    ],
  },
  {
    dayType: 'Legs',
    exercises: [
      { name: 'DB Goblet Squat', sets: 4, repRange: '12–15', category: 'Legs' },
      { name: 'Walking Lunges (DB in hand)', sets: 3, repRange: '12/leg', category: 'Legs' },
      { name: 'DB Romanian Deadlift', sets: 4, repRange: '12–15', category: 'Legs' },
      { name: 'Glute Bridge (DB across hips)', sets: 3, repRange: '15–20', category: 'Legs' },
      { name: 'Single-Leg DB Calf Raise', sets: 4, repRange: '15–20/leg', category: 'Calves' },
      { name: 'Wall Sit', sets: 3, repRange: 'max hold', category: 'Legs' },
      {
        name: 'Cardio (45 min) — 2 min brisk walk / 1 min easy jog',
        sets: 1,
        repRange: '45 min',
        category: 'Cardio',
      },
    ],
  },
  {
    dayType: 'Upper',
    exercises: [
      { name: 'Pull-ups (switch grip)', sets: 4, repRange: 'AMRAP', category: 'Back' },
      { name: 'DB Floor Press, slow tempo (3-1-3)', sets: 4, repRange: '10', category: 'Chest' },
      { name: 'Bent-Over DB Row', sets: 4, repRange: '12/side', category: 'Back' },
      { name: 'DB Arnold Press', sets: 3, repRange: '12', category: 'Shoulders' },
      { name: 'DB Lateral Raise', sets: 3, repRange: '15–20', category: 'Shoulders' },
      { name: 'DB Curl-to-Press', sets: 3, repRange: '10–12', category: 'Shoulders' },
      {
        name: 'Cardio (45 min) — 2 min brisk walk / 1 min easy jog',
        sets: 1,
        repRange: '45 min',
        category: 'Cardio',
      },
    ],
  },
  {
    dayType: 'Lower',
    exercises: [
      { name: 'Single-Leg DB RDL', sets: 4, repRange: '10/leg', category: 'Legs' },
      { name: 'Reverse Lunges (DB in hand)', sets: 4, repRange: '10/leg', category: 'Legs' },
      { name: 'DB Sumo Squat', sets: 3, repRange: '15', category: 'Legs' },
      { name: 'Single-Leg Glute Bridge', sets: 3, repRange: '12/leg', category: 'Legs' },
      { name: 'Standing DB Calf Raise', sets: 4, repRange: '20', category: 'Calves' },
      { name: 'DB Russian Twist or weighted sit-up', sets: 3, repRange: '15–20', category: 'Core' },
      {
        name: 'Cardio (45 min) — 2 min brisk walk / 1 min easy jog',
        sets: 1,
        repRange: '45 min',
        category: 'Cardio',
      },
    ],
  },
  {
    dayType: 'ActiveRecovery',
    exercises: [
      {
        name: '10,000 Brisk Steps (Accumulated)',
        sets: 1,
        repRange: '10,000 steps',
        trackingType: 'steps',
        stepTarget: 10000,
        currentSteps: 0,
        category: 'Cardio',
      },
      { name: 'Stretching / Mobility (10–15 min)', sets: 1, repRange: '10–15 min', category: 'Recovery' },
    ],
  },
  {
    dayType: 'Recovery',
    exercises: [
      {
        name: '10,000 Brisk Steps (Accumulated)',
        sets: 1,
        repRange: '10,000 steps',
        trackingType: 'steps',
        stepTarget: 10000,
        currentSteps: 0,
        category: 'Cardio',
      },
      { name: 'Stretching / Recovery', sets: 1, repRange: 'Mobility', category: 'Recovery' },
    ],
  },
];

const CATEGORY_DISPLAY_ORDER = [
  'Chest',
  'Shoulders',
  'Triceps',
  'Back',
  'Biceps',
  'Legs',
  'Calves',
  'Core',
  'Cardio',
  'Recovery',
];

const EXERCISE_CATEGORY_MAP = {};
for (const routine of WORKOUT_ROUTINES) {
  for (const ex of routine.exercises) {
    if (ex.name && ex.category) {
      EXERCISE_CATEGORY_MAP[ex.name] = ex.category;
    }
  }
}

const getExerciseCategory = (name) => EXERCISE_CATEGORY_MAP[name] || 'Other';

const groupExercisesByCategory = (exercises) => {
  if (!Array.isArray(exercises)) return [];
  const map = new Map();
  for (const ex of exercises) {
    const cat = ex.category || EXERCISE_CATEGORY_MAP[ex.name] || 'Other';
    if (!map.has(cat)) {
      map.set(cat, []);
    }
    map.get(cat).push(ex);
  }

  const result = [];
  for (const cat of CATEGORY_DISPLAY_ORDER) {
    if (map.has(cat)) {
      result.push({ category: cat, exercises: map.get(cat) });
      map.delete(cat);
    }
  }
  for (const [cat, exList] of map.entries()) {
    result.push({ category: cat, exercises: exList });
  }
  return result;
};

const WORKOUT_DAY_TYPES = WORKOUT_ROUTINES.map((w) => w.dayType);

const RECOVERY_DAY_TYPES = new Set(['ActiveRecovery', 'Recovery']);

const isRecoveryDayType = (dayType) => RECOVERY_DAY_TYPES.has(dayType);

/** Rough volume estimate: assume 15kg DB work for strength moves. */
const estimateExerciseVolumeKg = (exercise) => {
  const name = (exercise.name || '').toLowerCase();
  if (name.includes('cardio') || name.includes('steps') || name.includes('stretch') || name.includes('plank') || name.includes('hollow') || name.includes('russian')) {
    return 0;
  }
  const sets = exercise.sets || 1;
  const range = String(exercise.repRange || '');
  let reps = 10;
  if (/amrap/i.test(range)) reps = 8;
  else if (/sec/i.test(range)) return 0;
  else {
    const nums = range.match(/\d+/g);
    if (nums?.length) {
      const vals = nums.map(Number);
      reps = vals.length >= 2 ? (vals[0] + vals[1]) / 2 : vals[0];
    }
  }
  const loadKg = /bodyweight|push-up|pull-up|chin-up|pike|jump|lunge|raise|fly|twist/i.test(name)
    ? name.includes('db') || name.includes('dumbbell') || name.includes('goblet') || name.includes('press') || name.includes('curl') || name.includes('row') || name.includes('rdl') || name.includes('extension')
      ? 15
      : 0
    : 15;
  // Bodyweight calisthenics still count as work at ~body-mass proxy for "weight lifted" feel
  const effectiveLoad = loadKg > 0 ? loadKg : /pull-up|chin-up|push-up|pike|jump squat/i.test(name) ? 70 : 15;
  return Math.round(sets * reps * effectiveLoad);
};

const generateSetStructure = (exerciseName = '', repRange = '8–12', currentWeightKg = null) => {
  const name = exerciseName.toLowerCase();
  
  if (
    name.includes('cardio') ||
    name.includes('steps') ||
    name.includes('stretch') ||
    name.includes('mobility') ||
    name.includes('recovery') ||
    name.includes('wall sit') ||
    name.includes('plank') ||
    name.includes('hollow')
  ) {
    return [];
  }

  const isDumbbell =
    name.includes('db') ||
    name.includes('dumbbell') ||
    name.includes('goblet') ||
    name.includes('press') ||
    name.includes('curl') ||
    name.includes('row') ||
    name.includes('rdl') ||
    name.includes('fly') ||
    name.includes('raise') ||
    name.includes('extension') ||
    (name.includes('squat') && !name.includes('jump')) ||
    (name.includes('lunge') && !name.includes('bodyweight'));

  const workingWeight = currentWeightKg ?? (isDumbbell ? 10 : null);

  if (isDumbbell && workingWeight != null) {
    const w1 = Math.max(5, Math.round((workingWeight * 0.55) / 2.5) * 2.5);
    const w2 = Math.max(5, Math.round((workingWeight * 0.75) / 2.5) * 2.5);
    return [
      { setNumber: 1, type: 'warmup', suggestedWeight: w1, targetReps: '12–15' },
      { setNumber: 2, type: 'warmup', suggestedWeight: w2, targetReps: '8–10' },
      { setNumber: 3, type: 'working', suggestedWeight: workingWeight, targetReps: repRange },
      { setNumber: 4, type: 'working', suggestedWeight: workingWeight, targetReps: repRange },
      { setNumber: 5, type: 'working', suggestedWeight: workingWeight, targetReps: repRange },
    ];
  }

  return [
    { setNumber: 1, type: 'warmup', suggestedWeight: null, targetReps: '5–6' },
    { setNumber: 2, type: 'warmup', suggestedWeight: null, targetReps: '8–10' },
    { setNumber: 3, type: 'working', suggestedWeight: null, targetReps: repRange || 'AMRAP' },
    { setNumber: 4, type: 'working', suggestedWeight: null, targetReps: repRange || 'AMRAP' },
    { setNumber: 5, type: 'working', suggestedWeight: null, targetReps: repRange || 'AMRAP' },
  ];
};

module.exports = {
  WORKOUT_ROUTINES,
  WORKOUT_DAY_TYPES,
  RECOVERY_DAY_TYPES,
  CATEGORY_DISPLAY_ORDER,
  EXERCISE_CATEGORY_MAP,
  getExerciseCategory,
  groupExercisesByCategory,
  isRecoveryDayType,
  estimateExerciseVolumeKg,
  generateSetStructure,
};


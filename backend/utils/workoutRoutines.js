/** Canonical workout-of-the-day routines by weekday (UL × PPL + recovery). */

const WORKOUT_ROUTINES = [
  {
    dayType: 'Upper',
    exercises: [
      { name: 'Wide-Grip Pull-ups', sets: 5, repRange: 'AMRAP' },
      { name: 'Single-Arm DB Rows', sets: 4, repRange: '10–15' },
      { name: 'Decline Push-ups', sets: 4, repRange: '12–20' },
      { name: 'Single-Arm DB Overhead Press', sets: 4, repRange: '10–12' },
      { name: 'Leaning Lateral Raises', sets: 4, repRange: '15–20' },
      { name: 'Concentration Curls', sets: 3, repRange: '10–15' },
      { name: 'Lying DB Triceps Extensions', sets: 3, repRange: '10–15' },
      { name: 'Hanging Leg Raises', sets: 3, repRange: '10–15' },
      {
        name: 'Cardio (45 min) — 2 min brisk walk / 1 min easy jog',
        sets: 1,
        repRange: '45 min',
      },
    ],
  },
  {
    dayType: 'Lower',
    exercises: [
      { name: 'Goblet Squats', sets: 4, repRange: '12–20' },
      { name: 'Bulgarian Split Squats', sets: 4, repRange: '10–12' },
      { name: 'Single-Leg Romanian Deadlifts', sets: 4, repRange: '10–12' },
      { name: 'Walking Lunges', sets: 3, repRange: '12' },
      { name: 'Single-Leg Calf Raises', sets: 5, repRange: '20' },
      { name: 'Plank', sets: 3, repRange: '60 sec' },
      {
        name: 'Cardio (45 min) — 2 min brisk walk / 1 min easy jog',
        sets: 1,
        repRange: '45 min',
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
      },
      { name: 'Stretching / Mobility (10–15 min)', sets: 1, repRange: '10–15 min' },
    ],
  },
  {
    dayType: 'Push',
    exercises: [
      { name: 'Decline Push-ups', sets: 4, repRange: '12–20' },
      { name: 'Feet-Elevated Pike Push-ups', sets: 4, repRange: '8–15' },
      { name: 'Single-Arm DB Overhead Press', sets: 4, repRange: '10–12' },
      { name: 'Leaning Lateral Raises', sets: 5, repRange: '15–20' },
      { name: 'Standard Push-ups', sets: 3, repRange: '15–20' },
      { name: 'DB Overhead Triceps Extensions', sets: 3, repRange: '10–15' },
      { name: 'Diamond Push-ups', sets: 3, repRange: 'AMRAP' },
      { name: 'Hollow Body Hold', sets: 3, repRange: '45 sec' },
      {
        name: 'Cardio (45 min) — 2 min brisk walk / 1 min easy jog',
        sets: 1,
        repRange: '45 min',
      },
    ],
  },
  {
    dayType: 'Pull',
    exercises: [
      { name: 'Wide-Grip Pull-ups', sets: 5, repRange: 'AMRAP' },
      { name: 'Chin-ups', sets: 3, repRange: 'AMRAP' },
      { name: 'Single-Arm DB Rows', sets: 4, repRange: '10–15' },
      { name: 'Rear Delt Fly', sets: 4, repRange: '15–20' },
      { name: 'Hammer Curls', sets: 3, repRange: '10–15' },
      { name: 'Concentration Curls', sets: 3, repRange: '10–15' },
      { name: 'Hanging Knee Raises', sets: 3, repRange: '15–20' },
      {
        name: 'Cardio (45 min) — 2 min brisk walk / 1 min easy jog',
        sets: 1,
        repRange: '45 min',
      },
    ],
  },
  {
    dayType: 'Legs',
    exercises: [
      { name: 'Bulgarian Split Squats', sets: 4, repRange: '10–12' },
      { name: 'Goblet Squats', sets: 3, repRange: '15–20' },
      { name: 'Single-Leg Romanian Deadlifts', sets: 4, repRange: '10–12' },
      { name: 'Jump Squats', sets: 3, repRange: '20' },
      { name: 'Walking Lunges', sets: 2, repRange: '15' },
      { name: 'Single-Leg Calf Raises', sets: 5, repRange: '20' },
      { name: 'Russian Twists', sets: 3, repRange: '20' },
      {
        name: 'Cardio (45 min) — 2 min brisk walk / 1 min easy jog',
        sets: 1,
        repRange: '45 min',
      },
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
      },
      { name: 'Stretching / Recovery', sets: 1, repRange: 'Mobility' },
    ],
  },
];

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

module.exports = {
  WORKOUT_ROUTINES,
  WORKOUT_DAY_TYPES,
  RECOVERY_DAY_TYPES,
  isRecoveryDayType,
  estimateExerciseVolumeKg,
};

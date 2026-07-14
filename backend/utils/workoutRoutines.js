/** Canonical workout-of-the-day routines by day type. */

const WORKOUT_ROUTINES = [
  {
    dayType: 'UpperA',
    exercises: [
      { name: 'Pull-ups', sets: 4, repRange: 'AMRAP' },
      { name: 'Decline Push-ups', sets: 4, repRange: '12–20' },
      { name: 'Single-Arm 15kg DB Rows', sets: 4, repRange: '8–12/arm' },
      { name: 'Pike Push-ups', sets: 3, repRange: '8–15' },
      { name: '15kg DB Concentration Curls', sets: 3, repRange: '8–12/arm' },
      { name: 'Cardio (2 min brisk walk / 1 min moderate jog)', sets: 1, repRange: '45 min' },
    ],
  },
  {
    dayType: 'LowerA',
    exercises: [
      { name: '15kg DB Goblet Squats', sets: 4, repRange: '10–15' },
      {
        name: 'Walking Lunges (15kg DB, switch hands halfway)',
        sets: 4,
        repRange: '10–12/leg',
      },
      { name: 'Hanging Leg Raises', sets: 3, repRange: '8–15' },
      { name: 'Single-Leg Calf Raises (Holding 15kg DB)', sets: 4, repRange: '12–20/leg' },
      { name: 'Cardio (2 min brisk walk / 1 min moderate jog)', sets: 1, repRange: '45 min' },
    ],
  },
  {
    dayType: 'ActiveRecovery',
    exercises: [
      { name: 'Cardio (2 min brisk walk / 1 min true sprint)', sets: 1, repRange: '45 min' },
      { name: 'No lifting — CNS recovery', sets: 1, repRange: 'Rest' },
    ],
  },
  {
    dayType: 'UpperB',
    exercises: [
      { name: 'Chin-ups', sets: 4, repRange: 'AMRAP' },
      { name: '15kg Single-Arm DB Overhead Press', sets: 4, repRange: '8–12/arm' },
      { name: 'Standard Push-ups (Slow and controlled)', sets: 4, repRange: '15–25' },
      { name: '15kg DB Overhead Triceps Extensions', sets: 3, repRange: '8–12' },
      { name: 'Diamond Push-ups', sets: 3, repRange: 'AMRAP' },
      { name: 'Cardio (2 min brisk walk / 1 min moderate jog)', sets: 1, repRange: '45 min' },
    ],
  },
  {
    dayType: 'LowerB',
    exercises: [
      { name: '15kg Single-Leg Romanian Deadlifts (RDLs)', sets: 4, repRange: '8–12/leg' },
      {
        name: 'Bulgarian Split Squats (Bodyweight or holding 15kg DB)',
        sets: 4,
        repRange: '8–12/leg',
      },
      { name: 'Hanging Knee Tucks', sets: 3, repRange: '10–20' },
      { name: 'Jump Squats', sets: 3, repRange: '15–20' },
      { name: 'Cardio (2 min brisk walk / 1 min moderate jog)', sets: 1, repRange: '45 min' },
    ],
  },
  {
    dayType: 'Rest',
    exercises: [
      {
        name: 'Cardio (steady brisk walk — skip sprints, prep legs for Monday)',
        sets: 1,
        repRange: '45 min',
      },
      { name: 'Stretch, recover, and reset for the week', sets: 1, repRange: 'Mobility' },
    ],
  },
];

const WORKOUT_DAY_TYPES = WORKOUT_ROUTINES.map((w) => w.dayType);

module.exports = {
  WORKOUT_ROUTINES,
  WORKOUT_DAY_TYPES,
};

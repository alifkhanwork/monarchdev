require('dotenv').config();
const connectDB = require('../config/db');
const Workout = require('../models/Workout');
const { WORKOUT_ROUTINES } = require('../utils/workoutRoutines');

/** Replace all workout-of-the-day routines with the current plan. */
const syncWorkouts = async () => {
  await connectDB();

  await Workout.deleteMany({});
  await Workout.insertMany(WORKOUT_ROUTINES);

  const synced = await Workout.find().sort({ dayType: 1 });
  console.log(`Synced ${synced.length} workout day types:`);
  for (const w of synced) {
    console.log(`  ${w.dayType}: ${w.exercises.length} exercises`);
  }

  process.exit(0);
};

syncWorkouts().catch((err) => {
  console.error(err);
  process.exit(1);
});

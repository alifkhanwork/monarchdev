require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Item = require('../models/Item');
const DailyTask = require('../models/DailyTask');
const Workout = require('../models/Workout');
const Milestone = require('../models/Milestone');
const WeeklyGrind = require('../models/WeeklyGrind');
const MonthlyGrind = require('../models/MonthlyGrind');
const { getWeekKey, getMonthKey } = require('../utils/dateHelpers');
const { WORKOUT_ROUTINES } = require('../utils/workoutRoutines');

const seedData = async () => {
  await connectDB();

  // --- Items (Weapons & Relics) ---
  let starterWeapon = await Item.findOne({ name: "Hunter's Blade" });
  let starterRelic = await Item.findOne({ name: 'System Interface Ring' });
  let ssrWeapon = await Item.findOne({ name: "Baruka's Dagger" });
  let ssrRelic = await Item.findOne({ name: 'Shadow Soldiers Grimoire' });

  if (!starterWeapon) {
    starterWeapon = await Item.create({
      name: "Hunter's Blade",
      type: 'Weapon',
      rarity: 'R',
      statMultiplier: { strength: 1.05, agility: 1.05 },
      unlockCondition: 'Default starter gear',
      imageUrl: '/assets/gear/hunters-blade.png',
      description: 'A basic blade issued to newly awakened hunters.',
    });
  }

  if (!starterRelic) {
    starterRelic = await Item.create({
      name: 'System Interface Ring',
      type: 'Relic',
      rarity: 'R',
      statMultiplier: { intelligence: 1.05, perception: 1.05 },
      unlockCondition: 'Default starter gear',
      imageUrl: '/assets/gear/system-ring.png',
      description: 'A faintly glowing ring linked to The System.',
    });
  }

  if (!ssrWeapon) {
    ssrWeapon = await Item.create({
      name: "Baruka's Dagger",
      type: 'Weapon',
      rarity: 'SSR',
      statMultiplier: { strength: 1.25, agility: 1.2 },
      unlockCondition: 'Complete 90 consecutive workout days',
      imageUrl: '/assets/gear/baruka-dagger.png',
      description: 'A crimson SSR blade radiating lethal intent.',
    });
  }

  if (!ssrRelic) {
    ssrRelic = await Item.create({
      name: 'Shadow Soldiers Grimoire',
      type: 'Relic',
      rarity: 'SSR',
      statMultiplier: { intelligence: 1.25, perception: 1.2 },
      unlockCondition: 'Reach Level 20 and complete all Main Quests',
      imageUrl: '/assets/gear/shadow-grimoire.png',
      description: 'An azure SSR grimoire humming with shadow energy.',
    });
  }

  console.log('Items seeded');

  // --- User ---
  let user = await User.findOne();
  if (!user) {
    user = await User.create({
      inventory: [starterWeapon._id, starterRelic._id],
      equippedWeapon: starterWeapon._id,
      equippedRelic: starterRelic._id,
    });
    console.log('User seeded with starter loadout');
  } else {
    if (!user.stats.agility) {
      user.stats.agility = 10;
    }
    if (!user.inventory?.length) {
      user.inventory = [starterWeapon._id, starterRelic._id];
      user.equippedWeapon = starterWeapon._id;
      user.equippedRelic = starterRelic._id;
      await user.save();
      console.log('User loadout backfilled');
    }
  }

  // --- Daily Tasks ---
  const taskCount = await DailyTask.countDocuments();
  if (taskCount === 0) {
    await DailyTask.insertMany([
      {
        taskName: 'Wake up before 7 AM',
        category: 'Foundation',
        expReward: 25,
        statModifier: 'vitality',
      },
      {
        taskName: 'Make bed & tidy room',
        category: 'Foundation',
        expReward: 15,
        statModifier: 'perception',
      },
      {
        taskName: 'End of day journal entry',
        category: 'Foundation',
        expReward: 30,
        statModifier: 'perception',
      },
      {
        taskName: 'Complete workout of the day',
        category: 'Health',
        expReward: 50,
        statModifier: 'strength',
      },
      {
        taskName: 'Drink 3L of water',
        category: 'Health',
        expReward: 25,
        statModifier: 'vitality',
        lifetimeMetric: 'water_liters',
        defaultLogValue: 3,
        logValue: 3,
      },
      {
        taskName: 'Hit step / distance goal',
        category: 'Health',
        expReward: 40,
        statModifier: 'agility',
        lifetimeMetric: 'distance_km',
        defaultLogValue: 10,
        logValue: 10,
      },
      {
        taskName: 'Study / skill practice (1 hr)',
        category: 'Mental',
        expReward: 45,
        statModifier: 'intelligence',
        lifetimeMetric: 'study_hours',
        defaultLogValue: 1,
        logValue: 1,
      },
      {
        taskName: 'Meditation or mindfulness (15 min)',
        category: 'Mental',
        expReward: 30,
        statModifier: 'perception',
      },
      {
        taskName: 'Work on portfolio / job apps',
        category: 'Professional',
        expReward: 50,
        statModifier: 'intelligence',
      },
      {
        taskName: 'Networking or professional outreach',
        category: 'Professional',
        expReward: 35,
        statModifier: 'agility',
      },
    ]);
    console.log('Daily tasks seeded');
  }

  // Backfill lifetime-tracking quests for existing databases
  await DailyTask.updateMany(
    { category: 'Physical' },
    { $set: { category: 'Health' } }
  );
  await DailyTask.updateMany(
    { category: { $nin: ['Foundation', 'Health', 'Mental', 'Professional'] } },
    { $set: { category: 'Health' } }
  );

  await DailyTask.updateOne(
    { taskName: 'Study / skill practice (1 hr)' },
    {
      $set: {
        lifetimeMetric: 'study_hours',
        defaultLogValue: 1,
        logValue: 1,
      },
    }
  );

  const waterQuest = await DailyTask.findOne({
    taskName: { $in: ['Drink 2L of water', 'Drink 3L of water'] },
  });
  if (!waterQuest) {
    await DailyTask.create({
      taskName: 'Drink 3L of water',
      category: 'Health',
      expReward: 25,
      statModifier: 'vitality',
      lifetimeMetric: 'water_liters',
      defaultLogValue: 3,
      logValue: 3,
    });
    console.log('Water intake quest added');
  } else {
    waterQuest.taskName = 'Drink 3L of water';
    waterQuest.defaultLogValue = 3;
    if (!waterQuest.logValue || waterQuest.logValue <= 2) {
      waterQuest.logValue = 3;
    }
    await waterQuest.save();
    console.log('Water intake quest updated to 3L');
  }

  const stepsQuest = await DailyTask.findOne({
    taskName: { $in: ['Hit 10k steps (rest days)', 'Hit step / distance goal'] },
  });
  if (stepsQuest) {
    stepsQuest.taskName = 'Hit step / distance goal';
    stepsQuest.category = 'Health';
    stepsQuest.lifetimeMetric = 'distance_km';
    stepsQuest.defaultLogValue = stepsQuest.defaultLogValue || 10;
    stepsQuest.logValue = stepsQuest.logValue || stepsQuest.defaultLogValue;
    await stepsQuest.save();
  } else {
    await DailyTask.create({
      taskName: 'Hit step / distance goal',
      category: 'Health',
      expReward: 40,
      statModifier: 'agility',
      lifetimeMetric: 'distance_km',
      defaultLogValue: 10,
      logValue: 10,
    });
    console.log('Step/distance quest added');
  }

  // --- Workouts (always sync to current routine) ---
  await Workout.deleteMany({});
  await Workout.insertMany(WORKOUT_ROUTINES);
  console.log(`Workouts synced (${WORKOUT_ROUTINES.length} day types)`);

  // --- Milestones (S-Rank Gates) ---
  const LEVEL_20_MAIN_QUESTS = [
    { title: "Get a Driver's License", expReward: 500, ageGoal: 20 },
    { title: 'Get a high-paying part-time job', expReward: 750, ageGoal: 20 },
    { title: '3-Month Emergency Fund', expReward: 1000, ageGoal: 20 },
    { title: 'Learn to Cook Curry', expReward: 300, ageGoal: 20 },
    { title: 'Complete full checkup & bloodwork', expReward: 600, ageGoal: 20 },
    { title: 'Earn CPR / first aid certification', expReward: 450, ageGoal: 20 },
    { title: 'Maintain a 30-day consistent sleep schedule', expReward: 850, ageGoal: 20 },
    { title: 'Complete a dentist visit', expReward: 350, ageGoal: 20 },
    { title: 'Open a retirement / investment account', expReward: 500, ageGoal: 20 },
    { title: 'Track budget for 3 consecutive months', expReward: 900, ageGoal: 20 },
    { title: 'Check your credit score', expReward: 300, ageGoal: 20 },
    { title: 'Pay off debt (or stay debt-free)', expReward: 1150, ageGoal: 20 },
    { title: 'File your own taxes', expReward: 700, ageGoal: 20 },
    { title: 'Live independently for 1 month', expReward: 950, ageGoal: 20 },
    { title: 'Learn basic home & car maintenance', expReward: 500, ageGoal: 20 },
    { title: 'Set up health / renter / auto insurance', expReward: 550, ageGoal: 20 },
    { title: 'Learn 5 staple meals from memory', expReward: 650, ageGoal: 20 },
    { title: 'Meal prep a full week', expReward: 550, ageGoal: 20 },
    { title: 'Have a deep life-direction talk with parent or mentor', expReward: 500, ageGoal: 20 },
    { title: 'Maintain one friendship for a full year', expReward: 1000, ageGoal: 20 },
    { title: 'Travel or eat out alone once', expReward: 350, ageGoal: 20 },
    { title: 'Complete a course outside your field', expReward: 750, ageGoal: 20 },
    { title: 'Read 12 books in one year', expReward: 1100, ageGoal: 20 },
    { title: 'Try a new hobby', expReward: 400, ageGoal: 20 },
    { title: 'Write down what success means to you', expReward: 350, ageGoal: 20 },
  ];

  const milestoneCount = await Milestone.countDocuments();
  if (milestoneCount === 0) {
    await Milestone.insertMany([
      ...LEVEL_20_MAIN_QUESTS.map((q) => ({
        ...q,
        category: 'Level 20 Main Quest',
        rewardType: 'EXP',
      })),
      {
        title: '90-Day Workout Streak',
        category: 'SSR Gear Quest',
        rewardType: 'Item',
        rewardItemId: ssrWeapon._id,
      },
      {
        title: 'Monarch Ascension',
        category: 'SSR Gear Quest',
        rewardType: 'Item',
        rewardItemId: ssrRelic._id,
      },
    ]);
    console.log('Milestones seeded');
  }

  // Upsert sub-tasks on existing milestones
  const milestoneUpdates = [
    {
      title: "Get a Driver's License",
      targetDate: new Date('2026-12-31'),
      rewardStat: 'agility',
      rewardStatAmount: 3,
      subTasks: [
        { title: "Get learner's permit" },
        { title: 'Complete practice hours' },
        { title: 'Schedule road test' },
        { title: 'Pass road test' },
      ],
    },
    {
      title: 'Get a high-paying part-time job',
      targetDate: new Date('2026-09-30'),
      rewardStat: 'intelligence',
      rewardStatAmount: 5,
      subTasks: [
        { title: 'Update resume' },
        { title: 'Apply to 10 positions' },
        { title: 'Complete interviews' },
        { title: 'Accept offer' },
      ],
    },
    {
      title: '3-Month Emergency Fund',
      targetDate: new Date('2027-03-31'),
      rewardStat: 'vitality',
      rewardStatAmount: 5,
      subTasks: [
        { title: 'Open dedicated savings account' },
        { title: 'Save month 1 target' },
        { title: 'Save month 2 target' },
        { title: 'Save month 3 target' },
      ],
    },
    {
      title: 'Learn to Cook Curry',
      targetDate: new Date('2026-08-31'),
      rewardStat: 'perception',
      rewardStatAmount: 2,
      subTasks: [
        { title: 'Buy ingredients' },
        { title: 'Follow recipe once' },
        { title: 'Cook without recipe' },
      ],
    },
  ];

  for (const update of milestoneUpdates) {
    const m = await Milestone.findOne({ title: update.title });
    if (m) {
      if (!m.subTasks || m.subTasks.length === 0) {
        m.subTasks = update.subTasks;
      }
      if (!m.targetDate) m.targetDate = update.targetDate;
      if (!m.rewardStat) m.rewardStat = update.rewardStat;
      if (!m.rewardStatAmount) m.rewardStatAmount = update.rewardStatAmount;
      if (!m.rewardType) m.rewardType = 'EXP';
      await m.save();
    }
  }

  // Backfill Level 20 Main Quests and ageGoal for existing databases
  let addedQuests = 0;
  for (const quest of LEVEL_20_MAIN_QUESTS) {
    const exists = await Milestone.findOne({ title: quest.title });
    if (!exists) {
      await Milestone.create({
        title: quest.title,
        category: 'Level 20 Main Quest',
        rewardType: 'EXP',
        expReward: quest.expReward,
        ageGoal: quest.ageGoal,
      });
      addedQuests++;
    } else if (exists.ageGoal == null) {
      exists.ageGoal = quest.ageGoal;
      await exists.save();
    }
  }
  if (addedQuests > 0) {
    console.log(`Added ${addedQuests} Level 20 Main Quests`);
  }

  const ageBackfill = await Milestone.updateMany(
    { category: 'Level 20 Main Quest', $or: [{ ageGoal: null }, { ageGoal: { $exists: false } }] },
    { $set: { ageGoal: 20 } }
  );
  if (ageBackfill.modifiedCount > 0) {
    console.log(`Backfilled ageGoal on ${ageBackfill.modifiedCount} milestones`);
  }

  if (user && (user.currentAge == null || user.currentAge === undefined)) {
    user.currentAge = 20;
    await user.save();
  }

  const weekKey = getWeekKey();
  const monthKey = getMonthKey();

  const weeklyCount = await WeeklyGrind.countDocuments();
  if (weeklyCount === 0) {
    await WeeklyGrind.insertMany([
      {
        title: 'Workout 5x this week',
        category: 'Fitness',
        targetCount: 5,
        currentProgress: 0,
        periodKey: weekKey,
        trackingSource: 'workout',
      },
      {
        title: 'Study 5 hrs this week',
        category: 'Mental',
        targetCount: 5,
        currentProgress: 0,
        periodKey: weekKey,
        trackingSource: 'study_hours',
      },
      {
        title: 'Read 3 chapters',
        category: 'Mental',
        targetCount: 3,
        currentProgress: 0,
        periodKey: weekKey,
        trackingSource: 'manual',
      },
    ]);
    console.log('Weekly grind seeded');
  } else {
    const wWorkout = await WeeklyGrind.updateMany(
      { title: /workout/i, category: 'Fitness' },
      { $set: { trackingSource: 'workout' } }
    );
    if (wWorkout.modifiedCount > 0) {
      console.log(`Marked ${wWorkout.modifiedCount} weekly workout grind(s) as auto-tracked`);
    }
    const studyWeekly = await WeeklyGrind.findOne({ title: 'Study 5 hrs this week' });
    if (!studyWeekly) {
      await WeeklyGrind.create({
        title: 'Study 5 hrs this week',
        category: 'Mental',
        targetCount: 5,
        currentProgress: 0,
        periodKey: weekKey,
        trackingSource: 'study_hours',
      });
      console.log('Added weekly Study 5 hrs quest');
    } else if (studyWeekly.trackingSource !== 'study_hours') {
      studyWeekly.trackingSource = 'study_hours';
      await studyWeekly.save();
    }
  }

  const monthlyCount = await MonthlyGrind.countDocuments();
  if (monthlyCount === 0) {
    await MonthlyGrind.insertMany([
      {
        title: 'Save $500 this month',
        category: 'Finance',
        targetCount: 500,
        currentProgress: 0,
        periodKey: monthKey,
        trackingSource: 'manual',
      },
      {
        title: '10 workout sessions',
        category: 'Fitness',
        targetCount: 10,
        currentProgress: 0,
        periodKey: monthKey,
        trackingSource: 'workout',
      },
      {
        title: 'Study 20 hrs this month',
        category: 'Mental',
        targetCount: 20,
        currentProgress: 0,
        periodKey: monthKey,
        trackingSource: 'study_hours',
      },
      {
        title: 'Finish 1 course module',
        category: 'Professional',
        targetCount: 1,
        currentProgress: 0,
        periodKey: monthKey,
        trackingSource: 'manual',
      },
    ]);
    console.log('Monthly grind seeded');
  } else {
    const mWorkout = await MonthlyGrind.updateMany(
      { title: /workout/i, category: 'Fitness' },
      { $set: { trackingSource: 'workout' } }
    );
    if (mWorkout.modifiedCount > 0) {
      console.log(`Marked ${mWorkout.modifiedCount} monthly workout grind(s) as auto-tracked`);
    }
    const studyMonthly = await MonthlyGrind.findOne({ title: 'Study 20 hrs this month' });
    if (!studyMonthly) {
      await MonthlyGrind.create({
        title: 'Study 20 hrs this month',
        category: 'Mental',
        targetCount: 20,
        currentProgress: 0,
        periodKey: monthKey,
        trackingSource: 'study_hours',
      });
      console.log('Added monthly Study 20 hrs quest');
    } else if (studyMonthly.trackingSource !== 'study_hours') {
      studyMonthly.trackingSource = 'study_hours';
      await studyMonthly.save();
    }
  }

  console.log('Seed complete');
  await mongoose.connection.close();
};

seedData().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

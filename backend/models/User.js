const mongoose = require('mongoose');

const statSnapshotSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    stats: {
      strength: Number,
      intelligence: Number,
      perception: Number,
      vitality: Number,
      agility: Number,
    },
    totalPower: { type: Number, default: null },
    level: { type: Number, default: null },
    currentExp: { type: Number, default: null },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      default: 'Ace Avizandum',
    },
    currentAge: { type: Number, default: 20 },
    level: { type: Number, default: 1 },
    currentExp: { type: Number, default: 0 },
    expToNextLevel: { type: Number, default: 100 },
    stats: {
      strength: { type: Number, default: 10 },
      intelligence: { type: Number, default: 10 },
      perception: { type: Number, default: 10 },
      vitality: { type: Number, default: 10 },
      agility: { type: Number, default: 10 },
    },
    statHistory: { type: [statSnapshotSchema], default: [] },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    lastDayCompleteDate: { type: Date, default: null },
    lastProcessedDate: { type: Date, default: null },
    pendingPenalty: {
      date: { type: Date, default: null },
      incompleteCount: { type: Number, default: 0 },
      expLost: { type: Number, default: 0 },
      vitalityLost: { type: Number, default: 0 },
      rankDownWarning: { type: Boolean, default: false },
      dismissed: { type: Boolean, default: true },
    },
    todayDayStatus: {
      date: { type: String, default: '' },
      status: {
        type: String,
        enum: ['normal', 'sick', 'vacation', 'busy', 'rest'],
        default: 'normal',
      },
    },
    freezeHistory: [
      {
        date: { type: String, required: true },
        status: { type: String, required: true },
        label: { type: String, default: '' },
      },
    ],
    lifetimeStats: {
      studyHours: { type: Number, default: 0 },
      workoutsCompleted: { type: Number, default: 0 },
      waterLiters: { type: Number, default: 0 },
      distanceKm: { type: Number, default: 0 },
      totalSteps: { type: Number, default: 0 },
      activeRecoveryDays: { type: Number, default: 0 },
      totalWeightLiftedKg: { type: Number, default: 0 },
    },
    workoutStreak: { type: Number, default: 0 },
    bestWorkoutStreak: { type: Number, default: 0 },
    lastWorkoutStreakDate: { type: Date, default: null },
    personalRecords: {
      mostPullUps: { type: Number, default: null },
      heaviestGobletSquatKg: { type: Number, default: null },
      longestPlankSec: { type: Number, default: null },
      longestWalkKm: { type: Number, default: null },
      fastest10kStepsMin: { type: Number, default: null },
    },
    unlockedBadges: { type: [String], default: [] },
    lastWorkoutCountedDate: { type: Date, default: null },
    lastRecoveryCountedDate: { type: Date, default: null },
    dayCompletionLog: [
      {
        date: { type: String, required: true },
        status: {
          type: String,
          enum: ['complete', 'incomplete', 'frozen'],
          required: true,
        },
      },
    ],
    equippedTitle: { type: String, default: 'Novice Hunter' },
    availableTitles: {
      type: [String],
      default: ['Novice Hunter', 'Aspiring Shadow', 'Disciplined Warrior'],
    },
    /** Credits earned alongside EXP for the Reward Shop (does not affect level). */
    spendableExp: { type: Number, default: 0 },
    ownedShopItems: { type: [String], default: [] },
    activeThemeAccent: { type: String, default: null },
    cheatDayTokens: { type: Number, default: 0 },
    inventory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
    equippedWeapon: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
    equippedRelic: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

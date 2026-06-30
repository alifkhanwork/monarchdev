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
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      default: 'Mohammad Ismail Hossain J. Khan',
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
    },
    unlockedBadges: { type: [String], default: [] },
    lastWorkoutCountedDate: { type: Date, default: null },
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
    inventory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
    equippedWeapon: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
    equippedRelic: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

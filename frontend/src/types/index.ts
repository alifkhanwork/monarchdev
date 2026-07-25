export interface UserStats {
  strength: number;
  intelligence: number;
  perception: number;
  vitality: number;
  agility: number;
}

export interface StatHistoryEntry {
  date: string;
  stats: UserStats;
  totalPower?: number | null;
  level?: number | null;
  currentExp?: number | null;
}

export interface GearItem {
  _id: string;
  name: string;
  type: 'Weapon' | 'Relic' | 'Armor';
  rarity: 'R' | 'SR' | 'SSR';
  statMultiplier: Partial<UserStats>;
  unlockCondition?: string;
  imageUrl?: string;
  description?: string;
}

export interface RankInfo {
  name: string;
  level: number;
  totalPower: number;
}

export interface LifetimeBadge {
  id: string;
  name: string;
  threshold: number;
  unlocked: boolean;
  progress: number;
}

export interface LifetimeStats {
  studyHours: number;
  workoutsCompleted: number;
  waterLiters: number;
  distanceKm: number;
  totalSteps: number;
  activeRecoveryDays: number;
  totalWeightLiftedKg: number;
  workoutStreak: number;
  bestWorkoutStreak: number;
  personalRecords: {
    mostPullUps: number | null;
    heaviestGobletSquatKg: number | null;
    longestPlankSec: number | null;
    longestWalkKm: number | null;
    fastest10kStepsMin: number | null;
  };
  badges: {
    study_hours: LifetimeBadge[];
    workouts_completed: LifetimeBadge[];
    water_liters: LifetimeBadge[];
    distance_km: LifetimeBadge[];
    total_steps?: LifetimeBadge[];
  };
}

export interface WeeklyProgress {
  workoutsCompleted: number;
  workoutsTarget: number;
  recoveryCompleted: number;
  recoveryTarget: number;
  splitLabel: string;
}

export interface DayCompletionEntry {
  date: string;
  status: 'complete' | 'incomplete' | 'frozen';
}

export interface User {
  username: string;
  currentAge?: number;
  level: number;
  currentExp: number;
  expToNextLevel: number;
  stats: UserStats;
  effectiveStats?: UserStats;
  totalPower: number;
  statHistory: StatHistoryEntry[];
  streak: { current: number; best: number };
  nextRank: RankInfo | null;
  rankLadder?: RankInfo[];
  equippedTitle: string;
  availableTitles: string[];
  equippedWeapon: GearItem | null;
  equippedRelic: GearItem | null;
  inventory: GearItem[];
  lifetimeStats?: LifetimeStats;
  dayCompletionLog?: DayCompletionEntry[];
  weeklyProgress?: WeeklyProgress;
  spendableExp?: number;
  ownedShopItems?: string[];
  activeThemeAccent?: string | null;
  settings?: {
    weightUnit: 'kg' | 'lbs';
    weekStartsOn: 0 | 1;
    weeklyDigestEnabled?: boolean;
  };
  email?: string;
  cheatDayTokens?: number;
}

export interface PenaltyInfo {
  date: string;
  incompleteCount: number;
  expLost: number;
  vitalityLost?: number;
  rankDownWarning?: boolean;
  dismissed: boolean;
}

export type DayStatusType = 'normal' | 'sick' | 'vacation' | 'busy' | 'rest';

export interface DayStatusInfo {
  status: DayStatusType;
  label: string;
  badge: string | null;
  isFrozen: boolean;
}

export interface FreezeHistoryEntry {
  date: string;
  status: DayStatusType;
  label: string;
}

export interface DailyTask {
  _id: string;
  taskName: string;
  category: string;
  expReward: number;
  statModifier: string;
  statRewards?: { stat: string; amount: number }[];
  lifetimeMetric: 'none' | 'study_hours' | 'water_liters' | 'distance_km' | 'steps';
  defaultLogValue: number;
  logValue: number;
  logUnit: string | null;
  isCompleted: boolean;
  lastCompletedDate: string | null;
}

export interface GroupedTasks {
  category: string;
  tasks: DailyTask[];
}

export interface Exercise {
  _id: string;
  name: string;
  sets: number;
  repRange: string;
  completed: boolean;
  trackingType?: 'none' | 'steps';
  stepTarget?: number | null;
  currentSteps?: number | null;
  modality?: 'dumbbell' | 'bodyweight' | 'cardio' | 'mobility' | 'steps';
  currentWeightKg?: number | null;
  nextRecommendedWeightKg?: number | null;
  progressStage?: string | null;
  coachNote?: string | null;
  lastPerformance?: { dateKey?: string; weightKg?: number | null; sets?: number[] } | null;
  bestPerformance?: { dateKey?: string; weightKg?: number | null; sets?: number[]; totalReps?: number } | null;
}

export interface Workout {
  _id: string;
  dayType:
    | 'Upper'
    | 'Lower'
    | 'ActiveRecovery'
    | 'Push'
    | 'Pull'
    | 'Legs'
    | 'Recovery';
  isRecovery?: boolean;
  completionPercent?: number;
  exercises: Exercise[];
}

export interface DailiesResponse {
  date: string;
  dayType: string;
  dayStatus: DayStatusInfo;
  freezeHistory: FreezeHistoryEntry[];
  workout: Workout | null;
  tasks: DailyTask[];
  groupedTasks: GroupedTasks[];
  streak: { current: number; best: number };
  todayExp: { earned: number; possible: number };
  dayComplete: boolean;
  penalty: PenaltyInfo | null;
}

export interface MilestoneSubTask {
  _id: string;
  title: string;
  isCompleted: boolean;
}

export interface Milestone {
  _id: string;
  title: string;
  category: string;
  ageGoal: number | null;
  isCompleted: boolean;
  rewardType: 'EXP' | 'Item';
  expReward: number;
  rewardStat: string;
  rewardStatAmount: number;
  targetDate: string | null;
  subTasks: MilestoneSubTask[];
  progressPercent: number;
  rewardItem: Pick<GearItem, '_id' | 'name' | 'type' | 'rarity' | 'imageUrl'> | null;
  /** Prerequisite quest id — null/undefined = unlocked (backward compatible). */
  requiresMilestoneId?: string | null;
  isLocked?: boolean;
  requiresTitle?: string | null;
}

export interface GrindQuest {
  _id: string;
  missionKey?: string;
  title: string;
  description?: string;
  category: string;
  categoryIcon?: string;
  categoryColor?: string;
  targetCount: number;
  currentProgress: number;
  progressPercent: number;
  trackingSource?: string;
  autoTracked?: boolean;
  expReward?: number;
  unit?: string;
  isElite?: boolean;
  rewardClaimed?: boolean;
  sortOrder?: number;
}

export interface GrindResponse {
  periodKey: string;
  resetsInMs: number;
  quests: GrindQuest[];
  rewardClaims?: {
    missionKey?: string;
    title: string;
    expReward: number;
    levelUps?: number[];
  }[];
}

export interface CompleteTaskResponse {
  message: string;
  expGained: number;
  levelUps: number[];
  user: {
    level: number;
    currentExp: number;
    expToNextLevel: number;
    stats: UserStats;
  };
}

export interface WorkoutTaskReward {
  action: 'completed' | 'reverted';
  expGained?: number;
  expLost?: number;
  statModifier: string;
  statAmount: number;
  levelUps?: number[];
  levelDowns?: number[];
  taskId: string;
}

export interface WorkoutSyncResponse {
  workout: Workout;
  workoutFullyComplete: boolean;
  badgesUnlocked: { id: string; name: string }[];
  grindUpdates: unknown[];
  taskReward: WorkoutTaskReward | null;
  user: {
    level: number;
    currentExp: number;
    expToNextLevel: number;
    stats: UserStats;
  };
}

export interface UncompleteTaskResponse {
  message: string;
  expLost: number;
  levelDowns: number[];
  user: {
    level: number;
    currentExp: number;
    expToNextLevel: number;
    stats: UserStats;
  };
}

export interface WorkoutSessionExercise {
  exerciseName: string;
  weightKg?: number | null;
  targetSets?: number;
  targetRepRange?: string;
  sets: { setNumber: number; reps: number; weightKg?: number | null }[];
  progressionStage?: string;
  recommendation?: string;
  verdict?: string;
}

export interface WorkoutSession {
  _id?: string;
  dateKey: string;
  dayType: string;
  totalVolumeKg?: number;
  durationMin?: number | null;
  coachSummary?: { rating?: number; headline?: string; notes?: string[] };
  exercises: WorkoutSessionExercise[];
}

export interface ProgressAnalytics {
  weeklyVolumeKg: number;
  monthlyVolumeKg: number;
  averageSessionVolumeKg: number;
  averageDurationMin: number | null;
  sessionsLogged: number;
  uniqueTrainingDays: number;
  mostImprovedExercise: { exerciseName: string; delta: number } | null;
  strongestExercise: { exerciseName: string; score: number } | null;
  volumeByDay: { dateKey: string; volumeKg: number; dayType: string; rating: number | null }[];
  trainingWeek: number;
  beginnerPhase: boolean;
  availableWeights: number[];
}

export interface CoachFeedback {
  rating: number;
  headline: string;
  notes: string[];
  tips?: string[];
  cards: {
    exerciseName: string;
    verdict: string;
    recommendation: string;
    nextWeight?: number | null;
  }[];
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'title' | 'theme' | 'token' | string;
  payload: string;
  stackable?: boolean;
  owned: boolean;
  canAfford: boolean;
}

export interface ShopResponse {
  spendableExp: number;
  cheatDayTokens: number;
  activeThemeAccent: string | null;
  items: ShopItem[];
}


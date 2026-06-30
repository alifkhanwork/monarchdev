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
  badges: {
    study_hours: LifetimeBadge[];
    workouts_completed: LifetimeBadge[];
    water_liters: LifetimeBadge[];
    distance_km: LifetimeBadge[];
  };
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
}

export interface PenaltyInfo {
  date: string;
  incompleteCount: number;
  expLost: number;
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
  lifetimeMetric: 'none' | 'study_hours' | 'water_liters' | 'distance_km';
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
}

export interface Workout {
  _id: string;
  dayType: 'Upper' | 'Lower' | 'Rest';
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
}

export interface GrindQuest {
  _id: string;
  title: string;
  category: string;
  targetCount: number;
  currentProgress: number;
  progressPercent: number;
}

export interface GrindResponse {
  periodKey: string;
  resetsInMs: number;
  quests: GrindQuest[];
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

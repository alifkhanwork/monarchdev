import type {
  CoachFeedback,
  CompleteTaskResponse,
  DailyTask,
  DailiesResponse,
  DayStatusInfo,
  GrindResponse,
  Milestone,
  ProgressAnalytics,
  ShopResponse,
  UncompleteTaskResponse,
  User,
  WorkoutSession,
  WorkoutSyncResponse,
} from '@/types';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== 'undefined' ? '' : 'http://localhost:5000');

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  getUser: () => fetchAPI<User>('/api/user'),

  updateTitle: (title: string) =>
    fetchAPI<{ equippedTitle: string; availableTitles?: string[] }>('/api/user/title', {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    }),

  updateAge: (currentAge: number) =>
    fetchAPI<{ currentAge: number }>('/api/user/age', {
      method: 'PATCH',
      body: JSON.stringify({ currentAge }),
    }),

  updateSettings: (settings: {
    weightUnit?: 'kg' | 'lbs';
    weekStartsOn?: 0 | 1;
    weeklyDigestEnabled?: boolean;
    fiveDaysStraight?: boolean;
    email?: string;
  }) =>
    fetchAPI<{
      email?: string;
      settings: {
        weightUnit: 'kg' | 'lbs';
        weekStartsOn: 0 | 1;
        weeklyDigestEnabled?: boolean;
        fiveDaysStraight?: boolean;
      };
    }>('/api/user/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),

  startQuestSeason: (groupKey: string, ageGoal?: number | null) =>
    fetchAPI<{
      message: string;
      groupKey: string;
      seasonNumber: number;
      archivedCount: number;
    }>('/api/milestones/seasons/start', {
      method: 'POST',
      body: JSON.stringify({ groupKey, ageGoal }),
    }),

  dismissPenalty: () =>
    fetchAPI<{ message: string }>('/api/user/dismiss-penalty', { method: 'POST' }),

  getDailies: () => fetchAPI<DailiesResponse>('/api/dailies'),

  setDayStatus: (status: string) =>
    fetchAPI<{ dayStatus: DayStatusInfo }>('/api/dailies/day-status', {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  completeTask: (id: string) =>
    fetchAPI<CompleteTaskResponse>(`/api/dailies/complete/${id}`, { method: 'POST' }),

  uncompleteTask: (id: string) =>
    fetchAPI<UncompleteTaskResponse>(`/api/dailies/uncomplete/${id}`, { method: 'POST' }),

  toggleExercise: (workoutId: string, exerciseId: string) =>
    fetchAPI<WorkoutSyncResponse>(
      `/api/dailies/workout/${workoutId}/exercise/${exerciseId}`,
      { method: 'POST' }
    ),

  completeAllExercises: (workoutId: string) =>
    fetchAPI<WorkoutSyncResponse>(`/api/dailies/workout/${workoutId}/complete-all`, {
      method: 'POST',
    }),

  clearAllExercises: (workoutId: string) =>
    fetchAPI<WorkoutSyncResponse>(`/api/dailies/workout/${workoutId}/clear-all`, {
      method: 'POST',
    }),

  addExerciseSteps: (workoutId: string, exerciseId: string, delta: number) =>
    fetchAPI<WorkoutSyncResponse & { stepResult?: { currentSteps: number; stepTarget: number } }>(
      `/api/dailies/workout/${workoutId}/exercise/${exerciseId}/steps`,
      { method: 'POST', body: JSON.stringify({ delta }) }
    ),

  getMilestones: () => fetchAPI<Milestone[]>('/api/milestones'),

  toggleMilestoneSubtask: (milestoneId: string, subtaskId: string) =>
    fetchAPI<Milestone>(`/api/milestones/${milestoneId}/subtasks/${subtaskId}/toggle`, {
      method: 'POST',
    }),

  getWeeklyGrind: () => fetchAPI<GrindResponse>('/api/weekly'),

  updateWeeklyProgress: (id: string, delta: number) =>
    fetchAPI<{
      _id: string;
      currentProgress: number;
      progressPercent: number;
      rewardClaim?: { expReward: number; title?: string; levelUps?: number[] };
    }>(`/api/weekly/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify({ delta }),
    }),

  getMonthlyGrind: () => fetchAPI<GrindResponse>('/api/monthly'),

  updateMonthlyProgress: (id: string, delta: number) =>
    fetchAPI<{
      _id: string;
      currentProgress: number;
      progressPercent: number;
      rewardClaim?: { expReward: number; title?: string; levelUps?: number[] };
    }>(`/api/monthly/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify({ delta }),
    }),

  updateTaskLogValue: (id: string, value: number) =>
    fetchAPI<{ task: DailyTask; badgesUnlocked: { id: string; name: string }[] }>(
      `/api/dailies/log-value/${id}`,
      { method: 'PATCH', body: JSON.stringify({ value }) }
    ),

  logWorkoutSession: (body: {
    dayType: string;
    workoutId?: string;
    durationMin?: number;
    exercises: {
      exerciseName: string;
      weightKg?: number | null;
      targetSets: number;
      targetRepRange: string;
      sets: { setNumber: number; reps: number; weightKg?: number | null }[];
    }[];
  }) =>
    fetchAPI<{
      message: string;
      session: WorkoutSession;
      coach: CoachFeedback;
      trainingWeek: number;
      beginnerPhase: boolean;
    }>('/api/progress/log-session', { method: 'POST', body: JSON.stringify(body) }),

  getProgressAnalytics: () => fetchAPI<ProgressAnalytics>('/api/progress/analytics'),

  getWorkoutHistory: (limit = 30) =>
    fetchAPI<{ sessions: WorkoutSession[] }>(`/api/progress/history?limit=${limit}`),

  getExerciseProgress: () =>
    fetchAPI<{ exercises: unknown[]; availableWeights: number[] }>('/api/progress/exercises'),

  getShop: () => fetchAPI<ShopResponse>('/api/shop'),

  purchaseShopItem: (itemId: string) =>
    fetchAPI<{
      message: string;
      shop: ShopResponse;
      equippedTitle: string;
      availableTitles: string[];
    }>('/api/shop/purchase', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    }),

  equipShopTheme: (accent: string | null) =>
    fetchAPI<{ activeThemeAccent: string | null }>('/api/shop/equip-theme', {
      method: 'POST',
      body: JSON.stringify({ accent }),
    }),

  getJournal: (dateKey: string) =>
    fetchAPI<{ dateKey: string; text: string; updatedAt: string | null; encrypted: boolean }>(
      `/api/journals/${dateKey}`
    ),

  saveJournal: (dateKey: string, text: string, moodScore?: number | null) =>
    fetchAPI<{ dateKey: string; text: string; moodScore?: number | null; updatedAt: string | null; encrypted: boolean }>(
      `/api/journals/${dateKey}`,
      { method: 'PUT', body: JSON.stringify({ text, moodScore }) }
    ),

  logExerciseSet: (
    workoutId: string,
    exerciseId: string,
    payload: { setNumber: number; weightKg?: number | null; reps?: number; completed?: boolean }
  ) =>
    fetchAPI<WorkoutSyncResponse & { isPR?: boolean; prDetails?: unknown }>(
      `/api/dailies/workout/${workoutId}/exercise/${exerciseId}/set`,
      { method: 'POST', body: JSON.stringify(payload) }
    ),

  getAcademySubjects: () => fetchAPI<Subject[]>('/api/academy/subjects'),

  createAcademySubject: (data: { name: string; color?: string; code?: string }) =>
    fetchAPI<Subject>('/api/academy/subjects', { method: 'POST', body: JSON.stringify(data) }),

  deleteAcademySubject: (id: string) =>
    fetchAPI<{ message: string; id: string }>(`/api/academy/subjects/${id}`, { method: 'DELETE' }),

  getAcademyTasks: (params?: { status?: string; subjectId?: string; upcoming?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.subjectId) q.set('subjectId', params.subjectId);
    if (params?.upcoming) q.set('upcoming', 'true');
    const qs = q.toString();
    return fetchAPI<AcademyTask[]>(`/api/academy/tasks${qs ? `?${qs}` : ''}`);
  },

  createAcademyTask: (data: { title: string; subjectId: string; dueDate: string; status?: string; notes?: string }) =>
    fetchAPI<AcademyTask>('/api/academy/tasks', { method: 'POST', body: JSON.stringify(data) }),

  updateAcademyTask: (id: string, patch: Partial<{ title: string; subjectId: string; dueDate: string; status: string; notes: string }>) =>
    fetchAPI<AcademyTask>(`/api/academy/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  deleteAcademyTask: (id: string) =>
    fetchAPI<{ message: string; id: string }>(`/api/academy/tasks/${id}`, { method: 'DELETE' }),

  listJournals: (params?: { limit?: number; before?: string; month?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.before) q.set('before', params.before);
    if (params?.month) q.set('month', params.month);
    const qs = q.toString();
    return fetchAPI<{
      entries: { dateKey: string; text: string; moodScore?: number | null; updatedAt?: string }[];
      hasMore: boolean;
      nextBefore: string | null;
      limit: number;
    }>(`/api/journals${qs ? `?${qs}` : ''}`);
  },

  listJournalMonths: () => fetchAPI<{ months: string[] }>('/api/journals/months'),

  syncLocalJournals: (entries: Record<string, string>) =>
    fetchAPI<{ imported: number; skipped: number; invalid: number }>('/api/journals/sync-local', {
      method: 'POST',
      body: JSON.stringify({ entries }),
    }),
};

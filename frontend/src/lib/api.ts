import type {
  CompleteTaskResponse,
  DailyTask,
  DailiesResponse,
  DayStatusInfo,
  GrindResponse,
  Milestone,
  UncompleteTaskResponse,
  User,
  WorkoutSyncResponse,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
    fetchAPI<{ equippedTitle: string }>('/api/user/title', {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    }),

  updateAge: (currentAge: number) =>
    fetchAPI<{ currentAge: number }>('/api/user/age', {
      method: 'PATCH',
      body: JSON.stringify({ currentAge }),
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

  getMilestones: () => fetchAPI<Milestone[]>('/api/milestones'),

  toggleMilestoneSubtask: (milestoneId: string, subtaskId: string) =>
    fetchAPI<Milestone>(`/api/milestones/${milestoneId}/subtasks/${subtaskId}/toggle`, {
      method: 'POST',
    }),

  getWeeklyGrind: () => fetchAPI<GrindResponse>('/api/weekly'),

  updateWeeklyProgress: (id: string, delta: number) =>
    fetchAPI<{ _id: string; currentProgress: number; progressPercent: number }>(
      `/api/weekly/${id}/progress`,
      { method: 'POST', body: JSON.stringify({ delta }) }
    ),

  getMonthlyGrind: () => fetchAPI<GrindResponse>('/api/monthly'),

  updateMonthlyProgress: (id: string, delta: number) =>
    fetchAPI<{ _id: string; currentProgress: number; progressPercent: number }>(
      `/api/monthly/${id}/progress`,
      { method: 'POST', body: JSON.stringify({ delta }) }
    ),

  updateTaskLogValue: (id: string, value: number) =>
    fetchAPI<{ task: DailyTask; badgesUnlocked: { id: string; name: string }[] }>(
      `/api/dailies/log-value/${id}`,
      { method: 'PATCH', body: JSON.stringify({ value }) }
    ),
};

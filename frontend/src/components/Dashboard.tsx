'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type {
  CoachFeedback,
  CompleteTaskResponse,
  DailiesResponse,
  Milestone,
  UncompleteTaskResponse,
  User,
  WorkoutSyncResponse,
} from '@/types';
import type { TabId } from '@/types/tabs';
import SystemNav from '@/components/layout/SystemNav';
import DailyGrindTab from '@/components/tabs/DailyGrindTab';
import GrindHubTab from '@/components/tabs/GrindHubTab';
import PlayerProfileTab from '@/components/tabs/PlayerProfileTab';
import QuestBoardTab from '@/components/tabs/QuestBoardTab';
import LevelUpToast from '@/components/LevelUpToast';
import ActionToast from '@/components/ActionToast';
import WorkoutPerformanceModal from '@/components/workout/WorkoutPerformanceModal';
import CoachFeedbackModal from '@/components/workout/CoachFeedbackModal';
import { DAY_CLEARED_FLAVOR, pickFlavor, QUEST_CLEARED_FLAVOR } from '@/lib/systemFlavor';
import { toggleCustomQuestCompleted, type CustomQuest } from '@/lib/customQuestsStorage';
import {
  getTodayKey,
  loadJournalForDate,
  migrateLegacyJournal,
  saveJournalForDate,
} from '@/lib/journalStorage';

const WORKOUT_DAILY_TASK_NAME = 'Complete workout of the day';

type UndoToastState = {
  kind: 'server' | 'custom';
  taskId: string;
  title: string;
  expReward: number;
  flavor: string;
};

function loadTodayJournal(): string {
  migrateLegacyJournal();
  return loadJournalForDate(getTodayKey());
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('daily');
  const [user, setUser] = useState<User | null>(null);
  const [dailies, setDailies] = useState<DailiesResponse | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [journalEntry, setJournalEntry] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [flashingId, setFlashingId] = useState<string | null>(null);
  const [levelUps, setLevelUps] = useState<number[]>([]);
  const [workoutSyncing, setWorkoutSyncing] = useState(false);
  const [journalSaving, setJournalSaving] = useState(false);
  const [undoToast, setUndoToast] = useState<UndoToastState | null>(null);
  const [customQuestTick, setCustomQuestTick] = useState(0);
  const [perfModalOpen, setPerfModalOpen] = useState(false);
  const [perfSubmitting, setPerfSubmitting] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState<CoachFeedback | null>(null);
  const [coachMeta, setCoachMeta] = useState<{ week: number; beginner: boolean } | null>(null);

  const journalTask = dailies?.tasks.find((t) =>
    t.taskName.toLowerCase().includes('journal')
  );
  const journalFilled =
    journalEntry.trim().length >= 10 || (journalTask?.isCompleted ?? false);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [userData, dailiesData, milestonesData] = await Promise.all([
        api.getUser(),
        api.getDailies(),
        api.getMilestones(),
      ]);
      setUser(userData);
      setDailies(dailiesData);
      setMilestones(milestonesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshDailies = useCallback(async () => {
    const dailiesData = await api.getDailies();
    setDailies(dailiesData);
  }, []);

  useEffect(() => {
    setJournalEntry(loadTodayJournal());
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (activeTab === 'daily') {
      setJournalEntry(loadJournalForDate(getTodayKey()));
    }
  }, [activeTab]);

  useEffect(() => {
    if (!undoToast) return;
    const t = setTimeout(() => setUndoToast(null), 5000);
    return () => clearTimeout(t);
  }, [undoToast]);

  const showClearToast = (
    taskId: string,
    title: string,
    expReward: number,
    kind: 'server' | 'custom'
  ) => {
    setUndoToast({
      kind,
      taskId,
      title,
      expReward,
      flavor: pickFlavor(QUEST_CLEARED_FLAVOR),
    });
  };

  const handleUndoToast = async () => {
    if (!undoToast) return;
    const { kind, taskId } = undoToast;
    setUndoToast(null);
    try {
      if (kind === 'custom') {
        toggleCustomQuestCompleted(taskId, getTodayKey());
        setCustomQuestTick((n) => n + 1);
        return;
      }
      const result = await api.uncompleteTask(taskId);
      applyUserUpdate(result.user);
      updateTaskInDailies(taskId, false);
      const freshUser = await api.getUser();
      setUser(freshUser);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to undo');
    }
  };

  const handleJournalSave = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 10) {
      alert('Journal must be at least 10 characters.');
      return;
    }

    setJournalSaving(true);
    try {
      saveJournalForDate(getTodayKey(), trimmed);
      setJournalEntry(trimmed);

      if (dailies && !dailies.dayStatus.isFrozen && journalTask && !journalTask.isCompleted) {
        setCompletingId(journalTask._id);
        const result = await api.completeTask(journalTask._id);
        applyUserUpdate(result.user);
        updateTaskInDailies(journalTask._id, true);
        setFlashingId(journalTask._id);
        setTimeout(() => setFlashingId(null), 600);
        if (result.levelUps.length > 0) {
          setLevelUps(result.levelUps);
        }
        const freshUser = await api.getUser();
        setUser(freshUser);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save journal');
    } finally {
      setCompletingId(null);
      setJournalSaving(false);
    }
  };

  const applyUserUpdate = (
    userUpdate: CompleteTaskResponse['user'] | UncompleteTaskResponse['user']
  ) => {
    setUser((prev) =>
      prev
        ? {
            ...prev,
            level: userUpdate.level,
            currentExp: userUpdate.currentExp,
            expToNextLevel: userUpdate.expToNextLevel,
            stats: userUpdate.stats,
          }
        : prev
    );
  };

  const updateTaskInDailies = (taskId: string, isCompleted: boolean) => {
    setDailies((prev) => {
      if (!prev) return prev;
      const updateTask = (t: (typeof prev.tasks)[0]) =>
        t._id === taskId ? { ...t, isCompleted } : t;
      const tasks = prev.tasks.map(updateTask);
      const earned = tasks.filter((t) => t.isCompleted).reduce((s, t) => s + t.expReward, 0);
      return {
        ...prev,
        tasks,
        groupedTasks: prev.groupedTasks.map((g) => ({
          ...g,
          tasks: g.tasks.map(updateTask),
        })),
        todayExp: { ...prev.todayExp, earned },
      };
    });
  };

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    setCompletingId(taskId);
    try {
      if (isCompleted) {
        const result = await api.uncompleteTask(taskId);
        applyUserUpdate(result.user);
        updateTaskInDailies(taskId, false);
        setUndoToast(null);
      } else {
        const task = dailies?.tasks.find((t) => t._id === taskId);
        const result = await api.completeTask(taskId);
        applyUserUpdate(result.user);
        updateTaskInDailies(taskId, true);
        setFlashingId(taskId);
        setTimeout(() => setFlashingId(null), 600);
        if (task) {
          showClearToast(taskId, task.taskName, task.expReward, 'server');
        }
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(12);
          } catch {
            // ignore
          }
        }
        if (result.levelUps.length > 0) {
          setLevelUps(result.levelUps);
        }

        // Day fully cleared flavor (server tasks all done)
        const remaining =
          dailies?.tasks.filter((t) => t._id !== taskId && !t.isCompleted).length ?? 1;
        if (remaining === 0) {
          setTimeout(() => {
            setUndoToast((prev) =>
              prev
                ? { ...prev, flavor: pickFlavor(DAY_CLEARED_FLAVOR) }
                : prev
            );
          }, 50);
        }
      }
      const freshUser = await api.getUser();
      setUser(freshUser);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setCompletingId(null);
    }
  };

  const handleLogValueChange = async (taskId: string, value: number) => {
    try {
      const result = await api.updateTaskLogValue(taskId, value);
      setDailies((prev) => {
        if (!prev) return prev;
        const updateTask = (t: (typeof prev.tasks)[0]) =>
          t._id === taskId ? { ...t, ...result.task } : t;
        return {
          ...prev,
          tasks: prev.tasks.map(updateTask),
          groupedTasks: prev.groupedTasks.map((g) => ({
            ...g,
            tasks: g.tasks.map(updateTask),
          })),
        };
      });
      if (result.badgesUnlocked?.length) {
        const freshUser = await api.getUser();
        setUser(freshUser);
      }
    } catch (err) {
      await refreshDailies();
      alert(err instanceof Error ? err.message : 'Failed to update log value');
    }
  };

  const applyWorkoutSync = async (result: WorkoutSyncResponse) => {
    applyUserUpdate(result.user);
    if (result.taskReward?.levelUps?.length) {
      setLevelUps(result.taskReward.levelUps);
    }
    await refreshDailies();
  };

  const handleToggleExercise = async (workoutId: string, exerciseId: string) => {
    setWorkoutSyncing(true);
    try {
      const result = await api.toggleExercise(workoutId, exerciseId);
      await applyWorkoutSync(result);
      const freshUser = await api.getUser();
      setUser(freshUser);
    } catch (err) {
      await refreshDailies();
      alert(err instanceof Error ? err.message : 'Failed to update exercise');
    } finally {
      setWorkoutSyncing(false);
    }
  };

  const handleCompleteAllExercises = async (workoutId: string) => {
    setWorkoutSyncing(true);
    try {
      const result = await api.completeAllExercises(workoutId);
      await applyWorkoutSync(result);
      const freshUser = await api.getUser();
      setUser(freshUser);
    } catch (err) {
      await refreshDailies();
      alert(err instanceof Error ? err.message : 'Failed to complete workout');
    } finally {
      setWorkoutSyncing(false);
    }
  };

  const handleClearAllExercises = async (workoutId: string) => {
    setWorkoutSyncing(true);
    try {
      const result = await api.clearAllExercises(workoutId);
      await applyWorkoutSync(result);
      const freshUser = await api.getUser();
      setUser(freshUser);
    } catch (err) {
      await refreshDailies();
      alert(err instanceof Error ? err.message : 'Failed to clear workout');
    } finally {
      setWorkoutSyncing(false);
    }
  };

  const handleAddSteps = async (workoutId: string, exerciseId: string, delta: number) => {
    setWorkoutSyncing(true);
    try {
      const result = await api.addExerciseSteps(workoutId, exerciseId, delta);
      await applyWorkoutSync(result);
      const freshUser = await api.getUser();
      setUser(freshUser);
    } catch (err) {
      await refreshDailies();
      alert(err instanceof Error ? err.message : 'Failed to update steps');
    } finally {
      setWorkoutSyncing(false);
    }
  };

  const handleLogPerformanceSubmit = async (payload: {
    dayType: string;
    workoutId: string;
    durationMin?: number;
    exercises: {
      exerciseName: string;
      weightKg?: number | null;
      targetSets: number;
      targetRepRange: string;
      sets: { setNumber: number; reps: number; weightKg?: number | null }[];
    }[];
  }) => {
    setPerfSubmitting(true);
    try {
      const result = await api.logWorkoutSession(payload);
      setPerfModalOpen(false);
      setCoachFeedback(result.coach);
      setCoachMeta({ week: result.trainingWeek, beginner: result.beginnerPhase });
      setCoachOpen(true);
      await refreshDailies();
      const freshUser = await api.getUser();
      setUser(freshUser);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to log performance');
    } finally {
      setPerfSubmitting(false);
    }
  };

  const handleDismissPenalty = async () => {
    try {
      await api.dismissPenalty();
      setDailies((prev) => (prev ? { ...prev, penalty: null } : prev));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to dismiss penalty');
    }
  };

  const handleDayStatusChange = async (status: string) => {
    try {
      const result = await api.setDayStatus(status);
      setDailies((prev) =>
        prev
          ? {
              ...prev,
              dayStatus: result.dayStatus,
              penalty: result.dayStatus.isFrozen ? null : prev.penalty,
            }
          : prev
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update day status');
    }
  };

  const handleTitleChange = async (title: string) => {
    try {
      const result = await api.updateTitle(title);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              equippedTitle: result.equippedTitle,
              availableTitles: result.availableTitles ?? prev.availableTitles,
            }
          : prev
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update title');
    }
  };

  const handleAgeChange = async (age: number) => {
    try {
      await api.updateAge(age);
      setUser((prev) => (prev ? { ...prev, currentAge: age } : prev));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update age');
    }
  };

  const handleToggleSubtask = async (milestoneId: string, subtaskId: string) => {
    try {
      const updated = await api.toggleMilestoneSubtask(milestoneId, subtaskId);
      setMilestones((prev) => prev.map((m) => (m._id === milestoneId ? updated : m)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update sub-task');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm uppercase tracking-widest">Initializing System...</p>
        </div>
      </div>
    );
  }

  if (error || !user || !dailies) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="glass-panel max-w-md text-center p-8">
          <p className="text-red-400 font-semibold mb-2">Connection Failed</p>
          <p className="text-slate-400 text-sm mb-4">
            {error || 'Unable to reach The System API. Ensure the backend is running on port 5000.'}
          </p>
          <button type="button" onClick={fetchAll} className="system-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <LevelUpToast levels={levelUps} onDismiss={() => setLevelUps([])} />

      {undoToast && (
        <ActionToast
          message={`${undoToast.flavor}  ·  +${undoToast.expReward} EXP`}
          detail={`Quest cleared ✓ — ${undoToast.title}`}
          actionLabel="Undo"
          onAction={handleUndoToast}
          onDismiss={() => setUndoToast(null)}
        />
      )}

      <SystemNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        username={user.username}
        level={user.level}
        equippedTitle={user.equippedTitle}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-5 py-3 sm:py-4 pb-8">
        {activeTab === 'daily' && (
          <DailyGrindTab
            key={`daily-${customQuestTick}`}
            user={user}
            dailies={dailies}
            journalEntry={journalEntry}
            journalFilled={journalFilled}
            penalty={dailies.penalty}
            onJournalSave={handleJournalSave}
            journalSaving={journalSaving}
            journalQuestCompleted={journalTask?.isCompleted ?? false}
            onToggleTask={handleToggleTask}
            onToggleExercise={handleToggleExercise}
            onCompleteAllExercises={handleCompleteAllExercises}
            onClearAllExercises={handleClearAllExercises}
            onAddSteps={handleAddSteps}
            onLogPerformance={() => setPerfModalOpen(true)}
            workoutQuest={
              dailies.tasks.find((t) => t.taskName === WORKOUT_DAILY_TASK_NAME) ?? null
            }
            workoutSyncing={workoutSyncing}
            onDismissPenalty={handleDismissPenalty}
            onDayStatusChange={handleDayStatusChange}
            onLogValueChange={handleLogValueChange}
            completingId={completingId}
            flashingId={flashingId}
            onCustomQuestCleared={(q: CustomQuest) => {
              showClearToast(q.id, q.title, q.expReward, 'custom');
            }}
          />
        )}

        {activeTab === 'grind' && <GrindHubTab />}

        {activeTab === 'profile' && (
          <PlayerProfileTab user={user} onTitleChange={handleTitleChange} />
        )}

        {activeTab === 'milestones' && (
          <QuestBoardTab
            milestones={milestones}
            currentAge={user.currentAge ?? 20}
            onAgeChange={handleAgeChange}
            onToggleSubtask={handleToggleSubtask}
          />
        )}
      </main>

      {dailies?.workout && (
        <WorkoutPerformanceModal
          open={perfModalOpen}
          workout={dailies.workout}
          submitting={perfSubmitting}
          onClose={() => setPerfModalOpen(false)}
          onSubmit={handleLogPerformanceSubmit}
        />
      )}

      <CoachFeedbackModal
        open={coachOpen}
        coach={coachFeedback}
        trainingWeek={coachMeta?.week}
        beginnerPhase={coachMeta?.beginner}
        onClose={() => setCoachOpen(false)}
      />
    </>
  );
}

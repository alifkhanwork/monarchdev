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
import OnboardingModal from '@/components/OnboardingModal';
import SettingsTab from '@/components/tabs/SettingsTab';
import WorkoutPerformanceModal from '@/components/workout/WorkoutPerformanceModal';
import CoachFeedbackModal from '@/components/workout/CoachFeedbackModal';
import { DashboardBootSkeleton } from '@/components/ui/Skeleton';
import SectionErrorBoundary from '@/components/ui/SectionErrorBoundary';
import { DAY_CLEARED_FLAVOR, pickFlavor, QUEST_CLEARED_FLAVOR } from '@/lib/systemFlavor';
import { toggleCustomQuestCompleted, type CustomQuest } from '@/lib/customQuestsStorage';
import {
  getTodayKey,
  loadJournalForDate,
  migrateLegacyJournal,
  saveJournalForDate,
} from '@/lib/journalStorage';
import { applyThemeAccent } from '@/lib/themeAccent';
import { hasSeenOnboarding } from '@/lib/onboardingStorage';

const WORKOUT_DAILY_TASK_NAME = 'Complete workout of the day';

type UndoToastState = {
  kind: 'server' | 'custom' | 'exercise';
  taskId: string;
  title: string;
  expReward: number;
  flavor: string;
  workoutId?: string;
  exerciseId?: string;
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
  const [expPulse, setExpPulse] = useState(false);
  const [lastExpGain, setLastExpGain] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
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
    applyThemeAccent(user?.activeThemeAccent ?? null);
  }, [user?.activeThemeAccent]);

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

  useEffect(() => {
    if (!hasSeenOnboarding()) setShowOnboarding(true);
  }, []);

  const triggerExpPulse = (amount: number) => {
    if (amount <= 0) return;
    setLastExpGain(amount);
    setExpPulse(true);
    window.setTimeout(() => setExpPulse(false), 550);
  };

  const showClearToast = (
    taskId: string,
    title: string,
    expReward: number,
    kind: UndoToastState['kind'],
    extra?: Pick<UndoToastState, 'workoutId' | 'exerciseId'>
  ) => {
    setUndoToast({
      kind,
      taskId,
      title,
      expReward,
      flavor: pickFlavor(QUEST_CLEARED_FLAVOR),
      ...extra,
    });
    if (kind !== 'custom') triggerExpPulse(expReward);
  };

  const handleUndoToast = async () => {
    if (!undoToast) return;
    const { kind, taskId, workoutId, exerciseId } = undoToast;
    setUndoToast(null);
    try {
      if (kind === 'custom') {
        toggleCustomQuestCompleted(taskId, getTodayKey());
        setCustomQuestTick((n) => n + 1);
        return;
      }
      if (kind === 'exercise' && workoutId && exerciseId) {
        const result = await api.toggleExercise(workoutId, exerciseId);
        await applyWorkoutSync(result);
        const freshUser = await api.getUser();
        setUser(freshUser);
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
        showClearToast(journalTask._id, journalTask.taskName, journalTask.expReward, 'server');
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
      const before = dailies?.workout?.exercises.find((ex) => ex._id === exerciseId);
      const wasDone = before?.completed ?? false;
      const result = await api.toggleExercise(workoutId, exerciseId);
      await applyWorkoutSync(result);
      const freshUser = await api.getUser();
      setUser(freshUser);

      if (!wasDone) {
        const after = result.workout.exercises.find((ex) => ex._id === exerciseId);
        const title = after?.name ?? before?.name ?? 'Exercise';
        const workoutTask = dailies?.tasks.find((t) => t.taskName === WORKOUT_DAILY_TASK_NAME);
        const exp =
          result.taskReward?.action === 'completed'
            ? (result.taskReward.expGained ?? workoutTask?.expReward ?? 0)
            : 0;
        showClearToast(exerciseId, title, exp, 'exercise', { workoutId, exerciseId });
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(12);
          } catch {
            // ignore
          }
        }
      } else {
        setUndoToast(null);
      }
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
      await api.toggleMilestoneSubtask(milestoneId, subtaskId);
      // Refetch so prerequisite unlocks propagate to dependent quests
      const all = await api.getMilestones();
      setMilestones(all);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update sub-task');
    }
  };

  if (loading) {
    return (
      <>
        <header className="sticky top-0 z-40 border-b border-cyan-500/20 bg-slate-950/70 backdrop-blur-md h-14" />
        <DashboardBootSkeleton />
      </>
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

      {showOnboarding && <OnboardingModal onDone={() => setShowOnboarding(false)} />}

      {undoToast && (
        <ActionToast
          message={
            undoToast.expReward > 0
              ? `${undoToast.flavor}  ·  +${undoToast.expReward} EXP`
              : undoToast.flavor
          }
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
          <SectionErrorBoundary label="Daily Grind" onRetry={fetchAll}>
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
            expPulse={expPulse}
            lastExpGain={lastExpGain}
            onCustomQuestCleared={(q: CustomQuest) => {
              showClearToast(q.id, q.title, q.expReward, 'custom');
            }}
          />
          </SectionErrorBoundary>
        )}

        {activeTab === 'grind' && (
          <SectionErrorBoundary label="The Grind">
            <GrindHubTab />
          </SectionErrorBoundary>
        )}

        {activeTab === 'profile' && (
          <SectionErrorBoundary label="Player Profile" onRetry={fetchAll}>
          <PlayerProfileTab
            user={user}
            onTitleChange={handleTitleChange}
            onGoTrain={() => setActiveTab('daily')}
            onReplayTutorial={() => setShowOnboarding(true)}
            onShopPurchased={(patch) => {
              if (patch) {
                setUser((prev) =>
                  prev
                    ? {
                        ...prev,
                        ...(patch.availableTitles
                          ? { availableTitles: patch.availableTitles }
                          : {}),
                        ...(patch.activeThemeAccent !== undefined
                          ? { activeThemeAccent: patch.activeThemeAccent }
                          : {}),
                      }
                    : prev
                );
              }
              void fetchAll();
            }}
            onThemeEquipped={(accent) => {
              applyThemeAccent(accent);
              setUser((prev) =>
                prev ? { ...prev, activeThemeAccent: accent } : prev
              );
            }}
          />
          </SectionErrorBoundary>
        )}

        {activeTab === 'milestones' && (
          <SectionErrorBoundary label="Quest Board" onRetry={fetchAll}>
          <QuestBoardTab
            milestones={milestones}
            currentAge={user.currentAge ?? 20}
            onAgeChange={handleAgeChange}
            onToggleSubtask={handleToggleSubtask}
            onStartSeason={async (groupKey, ageGoal) => {
              const res = await api.startQuestSeason(groupKey, ageGoal);
              const all = await api.getMilestones();
              setMilestones(all);
              alert(res.message);
            }}
          />
          </SectionErrorBoundary>
        )}

        {activeTab === 'settings' && (
          <SectionErrorBoundary label="Settings">
          <SettingsTab
            user={user}
            onSettingsChange={(settings, extra) =>
              setUser((prev) =>
                prev
                  ? {
                      ...prev,
                      settings,
                      ...(extra?.email !== undefined ? { email: extra.email } : {}),
                    }
                  : prev
              )
            }
            onThemeEquipped={(accent) => {
              applyThemeAccent(accent);
              setUser((prev) =>
                prev ? { ...prev, activeThemeAccent: accent } : prev
              );
            }}
            onReplayOnboarding={() => setShowOnboarding(true)}
          />
          </SectionErrorBoundary>
        )}
      </main>

      {dailies?.workout && (
        <WorkoutPerformanceModal
          open={perfModalOpen}
          workout={dailies.workout}
          submitting={perfSubmitting}
          weightUnit={user.settings?.weightUnit === 'lbs' ? 'lbs' : 'kg'}
          onClose={() => setPerfModalOpen(false)}
          onSubmit={handleLogPerformanceSubmit}
        />
      )}

      <CoachFeedbackModal
        open={coachOpen}
        coach={coachFeedback}
        trainingWeek={coachMeta?.week}
        beginnerPhase={coachMeta?.beginner}
        weightUnit={user.settings?.weightUnit === 'lbs' ? 'lbs' : 'kg'}
        onClose={() => setCoachOpen(false)}
      />
    </>
  );
}

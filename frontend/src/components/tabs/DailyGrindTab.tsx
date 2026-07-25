'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DailiesResponse, DailyTask, PenaltyInfo, User } from '@/types';
import ExpProgressBar from './ExpProgressBar';
import DailyTaskList from './DailyTaskList';
import JournalPanel from './JournalPanel';
import PenaltyBanner from './PenaltyBanner';
import CustomQuestForm from './CustomQuestForm';
import QuestCheckRow from '@/components/quests/QuestCheckRow';
import {
  isCustomQuestCompleted,
  loadCustomQuestsForDate,
  removeCustomQuest,
  REST_DAY_RITUALS,
  toggleCustomQuestCompleted,
  type CustomQuest,
} from '@/lib/customQuestsStorage';
import { getTodayKey } from '@/lib/journalStorage';

interface DailyGrindTabProps {
  user: User;
  dailies: DailiesResponse;
  journalEntry: string;
  journalFilled: boolean;
  penalty: PenaltyInfo | null;
  onJournalSave: (text: string) => void | Promise<void>;
  journalSaving?: boolean;
  journalQuestCompleted?: boolean;
  onToggleTask: (taskId: string, isCompleted: boolean) => void;
  onToggleExercise: (workoutId: string, exerciseId: string) => void;
  onCompleteAllExercises: (workoutId: string) => void;
  onClearAllExercises: (workoutId: string) => void;
  onAddSteps?: (workoutId: string, exerciseId: string, delta: number) => void;
  onLogPerformance?: () => void;
  workoutQuest: DailyTask | null;
  workoutSyncing: boolean;
  onDismissPenalty: () => void;
  onDayStatusChange: (status: string) => void;
  onLogValueChange: (taskId: string, value: number) => void;
  completingId: string | null;
  flashingId: string | null;
  onCustomQuestCleared?: (quest: CustomQuest) => void;
}

export default function DailyGrindTab({
  user,
  dailies,
  journalEntry,
  journalFilled,
  penalty,
  onJournalSave,
  journalSaving = false,
  journalQuestCompleted = false,
  onToggleTask,
  onToggleExercise,
  onCompleteAllExercises,
  onClearAllExercises,
  onAddSteps,
  onLogPerformance,
  workoutQuest,
  workoutSyncing,
  onDismissPenalty,
  onDayStatusChange,
  onLogValueChange,
  completingId,
  flashingId,
  onCustomQuestCleared,
}: DailyGrindTabProps) {
  const [journalOpen, setJournalOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customQuests, setCustomQuests] = useState<CustomQuest[]>([]);
  const [ritualDone, setRitualDone] = useState<Record<string, boolean>>({});
  const journalPending = !journalFilled && !journalQuestCompleted;
  const todayKey = getTodayKey();
  const isRest = dailies.dayStatus.status === 'rest';

  useEffect(() => {
    setCustomQuests(loadCustomQuestsForDate(todayKey));
  }, [todayKey]);

  const questCounts = useMemo(() => {
    const tasks = dailies.tasks;
    return {
      done: tasks.filter((t) => t.isCompleted).length,
      total: tasks.length,
    };
  }, [dailies.tasks]);

  const refreshCustom = () => setCustomQuests(loadCustomQuestsForDate(todayKey));

  return (
    <div className="tab-content space-y-2.5">
      {penalty && !dailies.dayStatus.isFrozen && (
        <PenaltyBanner penalty={penalty} onDismiss={onDismissPenalty} />
      )}

      <ExpProgressBar
        sticky
        level={user.level}
        currentExp={user.currentExp}
        expToNextLevel={user.expToNextLevel}
        currentStreak={dailies.streak.current}
        bestStreak={dailies.streak.best}
        questDone={questCounts.done}
        questTotal={questCounts.total}
        freezeHistory={dailies.freezeHistory}
      />

      {isRest && (
        <section className="glass-panel !py-2.5 space-y-2">
          <p className="panel-label">Rest Day Rituals</p>
          <p className="text-meta">
            Optional only — streak is protected. Recurring dailies are paused until you return to
            Normal.
          </p>
          <ul className="space-y-1.5">
            {REST_DAY_RITUALS.map((r) => (
              <li key={r.id}>
                <QuestCheckRow
                  done={!!ritualDone[r.id]}
                  title={r.title}
                  meta={r.expNote}
                  onToggle={() => setRitualDone((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <DailyTaskList
        groupedTasks={dailies.groupedTasks}
        workout={dailies.workout}
        dayType={dailies.dayType}
        dayStatus={dailies.dayStatus}
        journalFilled={journalFilled}
        todayEarned={dailies.todayExp.earned}
        todayPossible={dailies.todayExp.possible}
        onDayStatusChange={onDayStatusChange}
        onToggleTask={onToggleTask}
        onToggleExercise={onToggleExercise}
        onCompleteAllExercises={onCompleteAllExercises}
        onClearAllExercises={onClearAllExercises}
        onAddSteps={onAddSteps}
        onLogPerformance={onLogPerformance}
        workoutQuest={workoutQuest}
        workoutSyncing={workoutSyncing}
        onLogValueChange={onLogValueChange}
        completingId={completingId}
        flashingId={flashingId}
      />

      <section className="glass-panel !py-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="panel-label">Custom Quests</p>
            <p className="text-meta">One-offs for today — local to this Hunter node</p>
          </div>
          {!showAddForm && (
            <button type="button" className="journal-action-btn" onClick={() => setShowAddForm(true)}>
              + Add quest
            </button>
          )}
        </div>

        {showAddForm && (
          <CustomQuestForm
            onCreated={() => {
              refreshCustom();
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {customQuests.length === 0 && !showAddForm && (
          <p className="text-meta py-2">No custom quests yet — add one when the System needs a side gate.</p>
        )}

        <ul className="space-y-1.5">
          {customQuests.map((q) => {
            const done = isCustomQuestCompleted(q.id, todayKey);
            return (
              <li key={q.id}>
                <QuestCheckRow
                  done={done}
                  title={q.title}
                  meta={`+${q.expReward} EXP · ${q.statModifier.toUpperCase()}${
                    q.targetCount ? ` · ×${q.targetCount}` : ''
                  }`}
                  onToggle={() => {
                    const nowDone = toggleCustomQuestCompleted(q.id, todayKey);
                    setCustomQuests([...loadCustomQuestsForDate(todayKey)]);
                    if (nowDone) onCustomQuestCleared?.(q);
                  }}
                  trailing={
                    <button
                      type="button"
                      className="text-[10px] text-slate-500 hover:text-red-300 px-2 min-h-[36px]"
                      onClick={() => {
                        removeCustomQuest(q.id, todayKey);
                        refreshCustom();
                      }}
                      aria-label={`Remove ${q.title}`}
                    >
                      Remove
                    </button>
                  }
                />
              </li>
            );
          })}
        </ul>
      </section>

      {!journalOpen && (
        <button type="button" className="journal-fab" onClick={() => setJournalOpen(true)}>
          <span aria-hidden>📓</span>
          <span>Journal</span>
          {journalPending && (
            <span className="ml-0.5 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          )}
        </button>
      )}

      {journalOpen && (
        <JournalPanel
          variant="drawer"
          journalEntry={journalEntry}
          onSave={onJournalSave}
          isFrozenDay={dailies.dayStatus.isFrozen}
          isToday
          isSaving={journalSaving}
          questCompleted={journalQuestCompleted}
          onClose={() => setJournalOpen(false)}
        />
      )}
    </div>
  );
}

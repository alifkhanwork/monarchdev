'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DailiesResponse, DailyTask, PenaltyInfo, User } from '@/types';
import ExpProgressBar from './ExpProgressBar';
import DailyTaskList from './DailyTaskList';
import JournalPanel from './JournalPanel';
import PenaltyBanner from './PenaltyBanner';
import CustomQuestForm from './CustomQuestForm';
import TodayPriorityCard from './TodayPriorityCard';
import QuestCheckRow from '@/components/quests/QuestCheckRow';
import CollapsibleCategoryHeader from '@/components/quests/CollapsibleCategoryHeader';
import { useCollapsibleSections } from '@/hooks/useCollapsibleSections';
import {
  isCustomQuestCompleted,
  loadCustomQuestsForDate,
  removeCustomQuest,
  REST_DAY_RITUALS,
  toggleCustomQuestCompleted,
  type CustomQuest,
} from '@/lib/customQuestsStorage';
import { getTodayKey } from '@/lib/journalStorage';

const CUSTOM_COLLAPSE_KEY = 'the-system-daily-custom-collapse';
const CUSTOM_SECTION = 'Custom Quests';

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
  expPulse?: boolean;
  lastExpGain?: number | null;
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
  expPulse = false,
  lastExpGain = null,
}: DailyGrindTabProps) {
  const [journalOpen, setJournalOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuest, setEditingQuest] = useState<CustomQuest | null>(null);
  const [customQuests, setCustomQuests] = useState<CustomQuest[]>([]);
  const [ritualDone, setRitualDone] = useState<Record<string, boolean>>({});
  const [flashingCustomId, setFlashingCustomId] = useState<string | null>(null);
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

  const customDone = customQuests.filter((q) => isCustomQuestCompleted(q.id, todayKey)).length;
  const customIncomplete = customQuests.length - customDone;
  // Open Custom Quests by default only when it has incomplete items and no other
  // preference yet — DailyTaskList owns habit/workout defaults separately.
  const customDefaultOpen = customIncomplete > 0 ? CUSTOM_SECTION : null;
  const { isCollapsed: isCustomCollapsed, toggle: toggleCustom } = useCollapsibleSections(
    CUSTOM_COLLAPSE_KEY,
    [CUSTOM_SECTION],
    customDefaultOpen
  );
  const customCollapsed = isCustomCollapsed(CUSTOM_SECTION);

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
        bestStreak={Math.max(dailies.streak.best, dailies.streak.current)}
        questDone={questCounts.done}
        questTotal={questCounts.total}
        freezeHistory={dailies.freezeHistory}
        expPulse={expPulse}
        lastExpGain={lastExpGain}
      />

      {!isRest && (
        <TodayPriorityCard
          tasks={dailies.tasks}
          onToggleTask={onToggleTask}
          completingId={completingId}
        />
      )}

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
        weightUnit={user.settings?.weightUnit === 'lbs' ? 'lbs' : 'kg'}
      />

      <section className="glass-panel !py-2.5 space-y-2">
        <CollapsibleCategoryHeader
          title="Custom Quests"
          icon="◇"
          done={customDone}
          total={customQuests.length}
          collapsed={customCollapsed}
          onToggle={() => toggleCustom(CUSTOM_SECTION)}
          trailing={
            !showAddForm && !editingQuest ? (
              <button
                type="button"
                className="journal-action-btn"
                onClick={() => setShowAddForm(true)}
              >
                + Add quest
              </button>
            ) : undefined
          }
        />

        {!customCollapsed && (
          <>
            <p className="text-meta px-0.5">One-offs for today — local to this Hunter node</p>

            {(showAddForm || editingQuest) && (
              <CustomQuestForm
                key={editingQuest?.id ?? 'new'}
                editing={editingQuest}
                onCreated={() => {
                  refreshCustom();
                  setShowAddForm(false);
                  setEditingQuest(null);
                }}
                onUpdated={() => {
                  refreshCustom();
                  setEditingQuest(null);
                  setShowAddForm(false);
                }}
                onCancel={() => {
                  setShowAddForm(false);
                  setEditingQuest(null);
                }}
              />
            )}

            {customQuests.length === 0 && !showAddForm && !editingQuest && (
              <p className="text-meta py-2">
                No custom quests yet — add one when the System needs a side gate.
              </p>
            )}

            <ul className="space-y-1.5">
              {customQuests.map((q) => {
                const done = isCustomQuestCompleted(q.id, todayKey);
                return (
                  <li key={q.id}>
                    <QuestCheckRow
                      done={done}
                      flashing={flashingCustomId === q.id}
                      title={q.title}
                      meta={`${q.recurring ? '↻ · ' : ''}+${q.expReward} EXP · ${q.statModifier.toUpperCase()}${
                        q.targetCount ? ` · ×${q.targetCount}` : ''
                      }`}
                      onToggle={() => {
                        const nowDone = toggleCustomQuestCompleted(q.id, todayKey);
                        setCustomQuests([...loadCustomQuestsForDate(todayKey)]);
                        if (nowDone) {
                          setFlashingCustomId(q.id);
                          setTimeout(() => setFlashingCustomId(null), 550);
                          onCustomQuestCleared?.(q);
                        }
                      }}
                      trailing={
                        <span className="flex items-center shrink-0">
                          <button
                            type="button"
                            className="text-[12px] text-slate-500 hover:text-cyan-300 px-1.5 min-h-[36px] min-w-[36px]"
                            onClick={() => {
                              setShowAddForm(false);
                              setEditingQuest(q);
                            }}
                            aria-label={`Edit ${q.title}`}
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="text-[12px] text-slate-500 hover:text-red-300 px-1.5 min-h-[36px] min-w-[36px]"
                            onClick={() => {
                              if (
                                !window.confirm(
                                  done
                                    ? `Delete “${q.title}”? Already-earned server EXP is unchanged (custom quests are local).`
                                    : `Delete “${q.title}”?`
                                )
                              ) {
                                return;
                              }
                              removeCustomQuest(q.id, todayKey);
                              if (editingQuest?.id === q.id) setEditingQuest(null);
                              refreshCustom();
                            }}
                            aria-label={`Delete ${q.title}`}
                            title="Delete"
                          >
                            🗑
                          </button>
                        </span>
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </>
        )}
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

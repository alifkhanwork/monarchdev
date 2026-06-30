'use client';

import type { DailiesResponse, DailyTask, PenaltyInfo, User, WorkoutSyncResponse } from '@/types';
import ExpProgressBar from './ExpProgressBar';
import DailyTaskList from './DailyTaskList';
import JournalPanel from './JournalPanel';
import PenaltyBanner from './PenaltyBanner';

interface DailyGrindTabProps {
  user: User;
  dailies: DailiesResponse;
  journalEntry: string;
  journalFilled: boolean;
  penalty: PenaltyInfo | null;
  onJournalChange: (value: string) => void;
  onToggleTask: (taskId: string, isCompleted: boolean) => void;
  onToggleExercise: (workoutId: string, exerciseId: string) => void;
  onCompleteAllExercises: (workoutId: string) => void;
  onClearAllExercises: (workoutId: string) => void;
  workoutQuest: DailyTask | null;
  workoutSyncing: boolean;
  onDismissPenalty: () => void;
  onDayStatusChange: (status: string) => void;
  onLogValueChange: (taskId: string, value: number) => void;
  completingId: string | null;
  flashingId: string | null;
}

export default function DailyGrindTab({
  user,
  dailies,
  journalEntry,
  journalFilled,
  penalty,
  onJournalChange,
  onToggleTask,
  onToggleExercise,
  onCompleteAllExercises,
  onClearAllExercises,
  workoutQuest,
  workoutSyncing,
  onDismissPenalty,
  onDayStatusChange,
  onLogValueChange,
  completingId,
  flashingId,
}: DailyGrindTabProps) {
  return (
    <div className="tab-content space-y-4">
      {penalty && <PenaltyBanner penalty={penalty} onDismiss={onDismissPenalty} />}

      <ExpProgressBar
        level={user.level}
        currentExp={user.currentExp}
        expToNextLevel={user.expToNextLevel}
        currentStreak={dailies.streak.current}
        bestStreak={dailies.streak.best}
        freezeHistory={dailies.freezeHistory}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0 lg:min-h-[calc(100dvh-220px)]">
        <div className="lg:col-span-3 min-h-[480px] lg:min-h-0">
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
            workoutQuest={workoutQuest}
            workoutSyncing={workoutSyncing}
            onLogValueChange={onLogValueChange}
            completingId={completingId}
            flashingId={flashingId}
          />
        </div>

        <div className="lg:col-span-2 min-h-[360px] lg:min-h-0">
          <JournalPanel
            journalEntry={journalEntry}
            onJournalChange={onJournalChange}
            isFrozenDay={dailies.dayStatus.isFrozen}
          />
        </div>
      </div>
    </div>
  );
}

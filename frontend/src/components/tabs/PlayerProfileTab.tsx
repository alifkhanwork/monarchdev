'use client';

import { useEffect, useState } from 'react';
import type { User } from '@/types';
import { api } from '@/lib/api';
import StatRadarChart from '@/components/profile/StatRadarChart';
import PerformanceOverviewChart from '@/components/profile/PerformanceOverviewChart';
import RankPreview from '@/components/profile/RankPreview';
import GearCard from '@/components/profile/GearCard';
import LockedGearSlot from '@/components/profile/LockedGearSlot';
import StreakCalendar from '@/components/profile/StreakCalendar';
import LifetimeStatsSection from '@/components/profile/LifetimeStatsSection';
import JournalPanel from '@/components/tabs/JournalPanel';
import { exportHunterBackup } from '@/lib/exportBackup';
import {
  formatJournalDateLabel,
  getTodayKey,
  loadJournalForDate,
  saveJournalForDate,
} from '@/lib/journalStorage';

interface PlayerProfileTabProps {
  user: User;
  onTitleChange: (title: string) => void;
}

type ProfilePanel = 'performance' | 'attributes';

export default function PlayerProfileTab({ user, onTitleChange }: PlayerProfileTabProps) {
  const [selectedDate, setSelectedDate] = useState(getTodayKey);
  const [journalEntry, setJournalEntry] = useState('');
  const [activePanel, setActivePanel] = useState<ProfilePanel>('performance');

  useEffect(() => {
    setJournalEntry(loadJournalForDate(selectedDate));
  }, [selectedDate]);

  const handleJournalSave = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 10) {
      alert('Journal must be at least 10 characters.');
      return;
    }
    saveJournalForDate(selectedDate, trimmed);
    setJournalEntry(trimmed);

    if (selectedDate === getTodayKey()) {
      try {
        const dailies = await api.getDailies();
        const journalTask = dailies.tasks.find((t) =>
          t.taskName.toLowerCase().includes('journal')
        );
        if (journalTask && !journalTask.isCompleted && !dailies.dayStatus.isFrozen) {
          await api.completeTask(journalTask._id);
        }
      } catch {
        // best-effort
      }
    }
  };

  const gearColumn = (
    <div className="space-y-2">
      <div className="interactive-card text-center py-3 px-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neon-teal/70">Total Power</p>
        <p className="text-4xl font-bold text-glow-gold font-mono-data leading-none mt-1">
          {user.totalPower.toLocaleString()}
        </p>
        <p className="text-[9px] text-slate-500 mt-1.5 uppercase tracking-wider">
          Base + gear + level
        </p>
      </div>
      <GearCard item={user.equippedWeapon} slot="weapon" emptyLabel="No weapon equipped" />
      <GearCard item={user.equippedRelic} slot="relic" emptyLabel="No relic equipped" />
      <LockedGearSlot slotName="Armor Slot" unlockHint="Unlock at Level 10" />
      <LockedGearSlot slotName="Accessory Slot" unlockHint="Complete an SSR Gear Quest" />
    </div>
  );

  return (
    <div className="tab-content space-y-2.5">
      <div className="glass-panel flex flex-col sm:flex-row sm:items-start justify-between gap-2 !py-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em] text-neon-teal/70">Hunter Profile</p>
          <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5 truncate">{user.username}</h2>
          <p className="text-[13px] text-amber-400/90 font-semibold italic">{user.equippedTitle}</p>
          <RankPreview
            currentTitle={user.equippedTitle}
            nextRank={user.nextRank}
            level={user.level}
            totalPower={user.totalPower}
          />
        </div>
        <div className="flex flex-col gap-2 shrink-0 items-stretch sm:items-end">
          <label className="text-[10px] uppercase tracking-wider text-slate-500">
            Equipped Title
            <select
              value={user.equippedTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="mt-1 block w-full text-[13px] bg-slate-950/70 border border-cyan-500/25 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none max-w-xs min-h-[36px]"
            >
              {user.availableTitles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </label>
          <p className="text-meta max-w-xs sm:text-right">
            Unlock titles from rank gates &amp; lifetime badges (Scholar, Warrior, Hydrated…).
          </p>
          <button
            type="button"
            className="journal-action-btn"
            onClick={() => exportHunterBackup(user)}
          >
            Export data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-2.5 items-start">
        <div className="lg:col-span-3 glass-panel !p-3 flex flex-col min-h-[280px]">
          <div className="flex gap-1.5 mb-3">
            <button
              type="button"
              onClick={() => setActivePanel('performance')}
              className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-all min-h-[36px] ${
                activePanel === 'performance'
                  ? 'border-neon-teal/50 bg-cyan-500/15 text-neon-teal'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Performance Graph
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('attributes')}
              className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-all min-h-[36px] ${
                activePanel === 'attributes'
                  ? 'border-neon-teal/50 bg-cyan-500/15 text-neon-teal'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Detailed Attributes
            </button>
          </div>

          {activePanel === 'performance' ? (
            <PerformanceOverviewChart
              history={user.statHistory || []}
              currentPower={user.totalPower}
              level={user.level}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              <div className="flex justify-center max-w-[260px] mx-auto w-full">
                <StatRadarChart stats={user.stats} effectiveStats={user.effectiveStats} />
              </div>
              <div className="lg:hidden">{gearColumn}</div>
              <div className="hidden md:block text-meta">
                Core attributes shape your Total Power. Equip relics and weapons to multiply soft
                stats — the radar shows effective values after gear.
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 hidden lg:block">{gearColumn}</div>
        {activePanel === 'performance' && <div className="lg:hidden">{gearColumn}</div>}
      </div>

      <StreakCalendar
        dayCompletionLog={user.dayCompletionLog || []}
        currentStreak={user.streak.current}
        bestStreak={user.streak.best}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <JournalPanel
        journalEntry={journalEntry}
        onSave={handleJournalSave}
        viewDateLabel={formatJournalDateLabel(selectedDate)}
        dateKey={selectedDate}
        isToday={selectedDate === getTodayKey()}
      />

      {user.lifetimeStats && <LifetimeStatsSection lifetimeStats={user.lifetimeStats} />}
    </div>
  );
}

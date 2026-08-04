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
import TrainingProgressSection from '@/components/profile/TrainingProgressSection';
import RewardShopSection from '@/components/profile/RewardShopSection';
import InsightsSection from '@/components/profile/InsightsSection';
import DiaryBrowseSection from '@/components/profile/DiaryBrowseSection';
import JournalPanel from '@/components/tabs/JournalPanel';
import SectionErrorBoundary from '@/components/ui/SectionErrorBoundary';
import { exportHunterBackup } from '@/lib/exportBackup';
import {
  downloadBlob,
  renderProgressSnapshot,
} from '@/lib/progressSnapshot';
import { DEFAULT_ACCENT_HEX, THEME_ACCENTS } from '@/lib/themeAccent';
import {
  fetchJournalForDate,
  formatJournalDateLabel,
  getTodayKey,
  saveJournalForDate,
  syncLocalJournalsToServer,
} from '@/lib/journalStorage';
import { validateJournalClient } from '@/lib/inputValidation';
import type { WeightUnit } from '@/lib/weightUnits';

interface PlayerProfileTabProps {
  user: User;
  onTitleChange: (title: string) => void;
  onGoTrain?: () => void;
  onReplayTutorial?: () => void;
  onShopPurchased?: (result?: {
    availableTitles?: string[];
    activeThemeAccent?: string | null;
  }) => void;
  onThemeEquipped?: (accent: string | null) => void;
}

type ChartPanel = 'performance' | 'attributes';
type ProfileSubTab = 'overview' | 'diary' | 'records';

const PROFILE_SUBTAB_KEY = 'the-system-profile-subtab';

function loadProfileSubTab(): ProfileSubTab {
  if (typeof window === 'undefined') return 'overview';
  try {
    const raw = sessionStorage.getItem(PROFILE_SUBTAB_KEY);
    if (raw === 'records' || raw === 'diary') return raw;
    return 'overview';
  } catch {
    return 'overview';
  }
}

function saveProfileSubTab(tab: ProfileSubTab) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PROFILE_SUBTAB_KEY, tab);
  } catch {
    // ignore
  }
}

export default function PlayerProfileTab({
  user,
  onTitleChange,
  onGoTrain,
  onReplayTutorial,
  onShopPurchased,
  onThemeEquipped,
}: PlayerProfileTabProps) {
  const [selectedDate, setSelectedDate] = useState(getTodayKey);
  const [journalEntry, setJournalEntry] = useState('');
  const [journalSaving, setJournalSaving] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<ChartPanel>('performance');
  const [subTab, setSubTab] = useState<ProfileSubTab>('overview');
  const [exportingImage, setExportingImage] = useState(false);

  useEffect(() => {
    setSubTab(loadProfileSubTab());
    void syncLocalJournalsToServer();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const text = await fetchJournalForDate(selectedDate);
      if (!cancelled) setJournalEntry(text);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const selectSubTab = (next: ProfileSubTab) => {
    setSubTab(next);
    saveProfileSubTab(next);
  };

  const openDiaryDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    selectSubTab('overview');
  };

  const handleExportImage = async () => {
    setExportingImage(true);
    try {
      const accentKey =
        user.activeThemeAccent === 'crimson' || user.activeThemeAccent === 'violet'
          ? user.activeThemeAccent
          : null;
      const blob = await renderProgressSnapshot({
        username: user.username,
        level: user.level,
        totalPower: user.totalPower,
        currentStreak: user.streak.current,
        bestStreak: Math.max(user.streak.best, user.streak.current),
        equippedTitle: user.equippedTitle,
        accentHex: accentKey ? THEME_ACCENTS[accentKey].hex : DEFAULT_ACCENT_HEX,
      });
      downloadBlob(blob, `dev-monarch-snapshot-${getTodayKey()}.png`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to export image');
    } finally {
      setExportingImage(false);
    }
  };

  const handleJournalSave = async (text: string) => {
    const check = validateJournalClient(text);
    if (!check.ok) {
      alert(check.message);
      return;
    }
    setJournalSaving(true);
    try {
      await saveJournalForDate(selectedDate, check.text);
      setJournalEntry(check.text);

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
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save journal');
    } finally {
      setJournalSaving(false);
    }
  };

  const gearColumn = (
    <div className="space-y-2 w-full">
      <div className="interactive-card text-center py-3 px-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neon-teal/70">Total Power</p>
        <p className="text-4xl font-bold text-glow-gold font-mono-data leading-none mt-1">
          {user.totalPower.toLocaleString()}
        </p>
        <p className="text-[9px] text-slate-400 mt-1.5 uppercase tracking-wider">
          Base + gear + level
        </p>
      </div>

      <div className="glass-panel !p-2.5 !py-3">
        <p className="panel-label mb-1 text-center">Hunter Stats</p>
        <p className="text-[9px] text-slate-400 text-center mb-2 uppercase tracking-wider">
          STR · VIT · INT · PER · AGI
          {user.effectiveStats ? ' · gear-adjusted' : ''}
        </p>
        <StatRadarChart
          stats={user.stats}
          effectiveStats={user.effectiveStats}
          compact
        />
        <div className="mt-2 grid grid-cols-5 gap-1 text-center">
          {(
            [
              ['STR', user.effectiveStats?.strength ?? user.stats.strength],
              ['VIT', user.effectiveStats?.vitality ?? user.stats.vitality],
              ['INT', user.effectiveStats?.intelligence ?? user.stats.intelligence],
              ['PER', user.effectiveStats?.perception ?? user.stats.perception],
              ['AGI', user.effectiveStats?.agility ?? user.stats.agility],
            ] as const
          ).map(([label, val]) => (
            <div key={label}>
              <p className="text-[9px] text-cyan-400/80 font-bold">{label}</p>
              <p className="text-[11px] font-mono-data text-slate-200">{val}</p>
            </div>
          ))}
        </div>
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
          <label className="text-[10px] uppercase tracking-wider text-slate-400">
            Equipped Title
            <select
              value={user.equippedTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="mt-1 block w-full text-[13px] bg-slate-950/70 border border-cyan-500/25 rounded px-2.5 py-1.5 text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400/80 max-w-xs min-h-[36px]"
            >
              {user.availableTitles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </label>
          <p className="text-meta max-w-xs sm:text-right">
            Titles unlock from rank gates, lifetime badges, and the EXP Reward Shop. Only owned
            titles appear here.
          </p>
          <button
            type="button"
            className="journal-action-btn"
            onClick={() => exportHunterBackup(user)}
          >
            Export data
          </button>
          <button
            type="button"
            className="journal-action-btn journal-action-btn-muted"
            onClick={handleExportImage}
            disabled={exportingImage}
          >
            {exportingImage ? 'Rendering…' : 'Export as Image'}
          </button>
          {onReplayTutorial && (
            <button
              type="button"
              className="journal-action-btn journal-action-btn-muted"
              onClick={onReplayTutorial}
            >
              Replay tutorial
            </button>
          )}
        </div>
      </div>

      {/* Matches The Grind Weekly/Monthly segmented control */}
      <div className="glass-panel !py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="inline-flex rounded border border-cyan-500/25 p-0.5 bg-slate-950/50">
          {(
            [
              { id: 'overview' as const, label: 'Overview' },
              { id: 'diary' as const, label: 'Diary' },
              { id: 'records' as const, label: 'Records & Progress' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => selectSubTab(tab.id)}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all min-h-[36px] ${subTab === tab.id
                  ? 'bg-cyan-500/20 text-neon-teal'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="text-meta">
          {subTab === 'overview'
            ? 'Stats, gear, streak & journal'
            : subTab === 'diary'
              ? 'Browsable journal history'
              : 'Shop, PRs, milestones & training log'}
        </p>
      </div>

      {subTab === 'overview' ? (
        <div className="space-y-2.5">
          <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-start">
            <div className="glass-panel !p-3 flex flex-col flex-1 min-w-0">
              <div className="flex gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => setActivePanel('performance')}
                  className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-all min-h-[36px] ${activePanel === 'performance'
                      ? 'border-neon-teal/50 bg-cyan-500/15 text-neon-teal'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                >
                  Performance Graph
                </button>
                <button
                  type="button"
                  onClick={() => setActivePanel('attributes')}
                  className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-all min-h-[36px] ${activePanel === 'attributes'
                      ? 'border-neon-teal/50 bg-cyan-500/15 text-neon-teal'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                >
                  Detailed Attributes
                </button>
              </div>

              {activePanel === 'performance' ? (
                <SectionErrorBoundary label="Performance Graph">
                  <PerformanceOverviewChart
                    history={user.statHistory || []}
                    currentPower={user.totalPower}
                    level={user.level}
                  />
                </SectionErrorBoundary>
              ) : (
                <div className="flex flex-col md:flex-row gap-3 items-center md:items-start">
                  <div className="flex justify-center max-w-[260px] w-full shrink-0">
                    <StatRadarChart stats={user.stats} effectiveStats={user.effectiveStats} />
                  </div>
                  <p className="text-meta md:pt-2">
                    Hunter attributes: Strength / STR (workouts), Vitality / VIT (sleep, water,
                    nutrition), Intelligence / INT (study &amp; portfolio), Perception / PER
                    (journal &amp; reading), Agility / AGI (cardio &amp; recovery). Cyan fill uses
                    gear-adjusted (effective) stats; slate outline is base when gear boosts apply.
                  </p>
                </div>
              )}
            </div>

            <div className="w-full lg:w-64 xl:w-72 shrink-0">{gearColumn}</div>
          </div>

          {user.lifetimeStats && (
            <LifetimeStatsSection
              lifetimeStats={user.lifetimeStats}
              weeklyProgress={user.weeklyProgress}
              onGoTrain={onGoTrain}
              sections={['hunterProgress']}
              weightUnit={(user.settings?.weightUnit === 'lbs' ? 'lbs' : 'kg') as WeightUnit}
            />
          )}

          <InsightsSection user={user} />

          <SectionErrorBoundary label="Streak Heatmap">
            <StreakCalendar
              dayCompletionLog={user.dayCompletionLog || []}
              currentStreak={user.streak.current}
              bestStreak={Math.max(user.streak.best, user.streak.current)}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              weekStartsOn={user.settings?.weekStartsOn === 0 ? 0 : 1}
            />
          </SectionErrorBoundary>

          {!journalOpen && (
            <button
              type="button"
              className="journal-fab"
              onClick={() => setJournalOpen(true)}
            >
              <span aria-hidden>📓</span>
              <span>Journal</span>
            </button>
          )}

          {journalOpen && (
            <JournalPanel
              variant="drawer"
              journalEntry={journalEntry}
              onSave={handleJournalSave}
              viewDateLabel={formatJournalDateLabel(selectedDate)}
              dateKey={selectedDate}
              isToday={selectedDate === getTodayKey()}
              isSaving={journalSaving}
              onClose={() => setJournalOpen(false)}
            />
          )}
        </div>
      ) : subTab === 'diary' ? (
        <SectionErrorBoundary label="Hunter Diary">
          <DiaryBrowseSection onOpenDate={openDiaryDate} />
        </SectionErrorBoundary>
      ) : (
        <div className="space-y-2.5">
          <RewardShopSection onPurchased={onShopPurchased} onThemeEquipped={onThemeEquipped} />

          {user.lifetimeStats && (
            <LifetimeStatsSection
              lifetimeStats={user.lifetimeStats}
              weeklyProgress={user.weeklyProgress}
              onGoTrain={onGoTrain}
              sections={['weeklyProgress', 'personalRecords', 'milestones']}
              weightUnit={(user.settings?.weightUnit === 'lbs' ? 'lbs' : 'kg') as WeightUnit}
            />
          )}

          <SectionErrorBoundary label="Training History">
            <TrainingProgressSection
              onGoTrain={onGoTrain}
              weightUnit={(user.settings?.weightUnit === 'lbs' ? 'lbs' : 'kg') as WeightUnit}
            />
          </SectionErrorBoundary>
        </div>
      )}
    </div>
  );
}

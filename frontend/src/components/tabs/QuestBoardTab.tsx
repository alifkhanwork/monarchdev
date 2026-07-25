'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Milestone } from '@/types';
import MilestoneCard from '@/components/milestones/MilestoneCard';
import CollapsibleCategoryHeader from '@/components/quests/CollapsibleCategoryHeader';
import { useCollapsibleSections } from '@/hooks/useCollapsibleSections';
import { isMilestoneOverdue } from '@/lib/questBoardHelpers';

const MAIN_QUEST_CATEGORY = 'Level 20 Main Quest';
const GEAR_SECTION = 'SSR Gear Quests';
const COLLAPSE_KEY = 'the-system-quest-board-collapse';

type SortMode = 'default' | 'due' | 'exp' | 'progress';

interface QuestBoardTabProps {
  milestones: Milestone[];
  currentAge: number;
  onAgeChange: (age: number) => void;
  onToggleSubtask: (milestoneId: string, subtaskId: string) => void;
}

function isMainQuest(m: Milestone) {
  return m.category === MAIN_QUEST_CATEGORY;
}

function inferGroup(title: string): string {
  const t = title.toLowerCase();
  if (/license|job|credit|debt|budget|fund|invest|retirement|pay/.test(t)) return 'Career & Finance';
  if (/cook|dentist|checkup|blood|cpr|sleep|health/.test(t)) return 'Health & Vitality';
  return 'Personal Growth';
}

function sortMilestones(list: Milestone[], mode: SortMode): Milestone[] {
  const copy = [...list];
  if (mode === 'due') {
    return copy.sort((a, b) => {
      const ta = a.targetDate ? new Date(a.targetDate).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.targetDate ? new Date(b.targetDate).getTime() : Number.POSITIVE_INFINITY;
      return ta - tb;
    });
  }
  if (mode === 'exp') {
    return copy.sort((a, b) => b.expReward - a.expReward);
  }
  if (mode === 'progress') {
    return copy.sort((a, b) => a.progressPercent - b.progressPercent);
  }
  return copy;
}

export default function QuestBoardTab({
  milestones,
  currentAge,
  onAgeChange,
  onToggleSubtask,
}: QuestBoardTabProps) {
  const [viewingAge, setViewingAge] = useState(currentAge);
  const [ageDraft, setAgeDraft] = useState(String(currentAge));
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [search, setSearch] = useState('');
  const [hideClearedCategories, setHideClearedCategories] = useState(true);

  useEffect(() => {
    setViewingAge(currentAge);
    setAgeDraft(String(currentAge));
  }, [currentAge]);

  const availableAges = useMemo(() => {
    const ages = milestones
      .filter(isMainQuest)
      .map((m) => m.ageGoal)
      .filter((age): age is number => age != null);
    return [...new Set(ages)].sort((a, b) => a - b);
  }, [milestones]);

  const query = search.trim().toLowerCase();

  const mainQuests = useMemo(() => {
    let list = milestones.filter((m) => isMainQuest(m) && m.ageGoal === viewingAge);
    if (query) {
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.category.toLowerCase().includes(query) ||
          inferGroup(m.title).toLowerCase().includes(query)
      );
    }
    return sortMilestones(list, sortMode);
  }, [milestones, viewingAge, query, sortMode]);

  const gearQuests = useMemo(() => {
    let list = milestones.filter((m) => m.category === 'SSR Gear Quest');
    if (query) {
      list = list.filter((m) => m.title.toLowerCase().includes(query));
    }
    return sortMilestones(list, sortMode);
  }, [milestones, query, sortMode]);

  const completed = mainQuests.filter((m) => m.isCompleted).length;
  const overdueCount = mainQuests.filter((m) =>
    isMilestoneOverdue(m.targetDate, m.isCompleted)
  ).length;

  const grouped = useMemo(() => {
    const map = new Map<string, Milestone[]>();
    for (const m of mainQuests) {
      const g = inferGroup(m.title);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(m);
    }
    return [...map.entries()].filter(([, quests]) => {
      if (!hideClearedCategories) return true;
      return !quests.every((q) => q.isCompleted);
    });
  }, [mainQuests, hideClearedCategories]);

  const sectionIds = useMemo(() => {
    const ids = grouped.map(([g]) => g);
    if (gearQuests.length > 0) ids.push(GEAR_SECTION);
    return ids;
  }, [grouped, gearQuests.length]);

  // All categories collapsed by default (null = no auto-open).
  // sectionIds must be stable once milestones load so the hook can hydrate.
  const { isCollapsed, toggle } = useCollapsibleSections(
    COLLAPSE_KEY,
    sectionIds,
    null
  );

  const commitAge = () => {
    const parsed = parseInt(ageDraft, 10);
    if (!Number.isNaN(parsed) && parsed >= 10 && parsed <= 120 && parsed !== currentAge) {
      onAgeChange(parsed);
      setViewingAge(parsed);
    } else {
      setAgeDraft(String(currentAge));
    }
  };

  const showSearch = milestones.length >= 8;

  return (
    <div className="tab-content space-y-2.5">
      <div className="glass-panel flex flex-col gap-2 !py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="panel-label">The Quest Board</p>
            <p className="text-meta mt-0.5">Long-term S-Rank gates & achievements</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[10px] uppercase tracking-wider">Age</span>
              <input
                type="number"
                min={10}
                max={120}
                value={ageDraft}
                onChange={(e) => setAgeDraft(e.target.value)}
                onBlur={commitAge}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="quest-log-input w-12 text-center"
                aria-label="Your current age"
              />
            </label>

            <select
              value={viewingAge}
              onChange={(e) => setViewingAge(Number(e.target.value))}
              className="text-[11px] bg-slate-950/70 border border-cyan-500/25 rounded px-2 py-1.5 text-cyan-300 focus:outline-none min-h-[36px]"
              aria-label="View quests by age"
            >
              {(availableAges.length > 0 ? availableAges : [currentAge]).map((age) => (
                <option key={age} value={age}>
                  Age {age}
                </option>
              ))}
            </select>

            <span className="text-[11px] text-slate-400">
              Cleared{' '}
              <span className="text-neon-teal font-bold font-mono-data">
                {completed}/{mainQuests.length}
              </span>
              {overdueCount > 0 && (
                <span className="ml-2 text-red-400 font-mono-data">{overdueCount} overdue</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="uppercase tracking-wider">Sort</span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="text-[11px] bg-slate-950/70 border border-cyan-500/25 rounded px-2 py-1.5 text-cyan-300 focus:outline-none min-h-[36px]"
            >
              <option value="default">Default</option>
              <option value="due">Due date</option>
              <option value="exp">EXP reward</option>
              <option value="progress">Completion %</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-[11px] text-slate-400 min-h-[36px] cursor-pointer">
            <input
              type="checkbox"
              checked={hideClearedCategories}
              onChange={(e) => setHideClearedCategories(e.target.checked)}
              className="rounded border-cyan-500/40"
            />
            Hide cleared categories
          </label>

          {showSearch && (
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quests…"
              className="quest-log-input flex-1 min-w-[140px] max-w-xs"
              aria-label="Search quest board"
            />
          )}
        </div>
      </div>

      {grouped.map(([group, quests]) => {
        const done = quests.filter((q) => q.isCompleted).length;
        const collapsed = isCollapsed(group);
        return (
          <section key={group} className="space-y-1.5">
            <CollapsibleCategoryHeader
              title={group}
              icon="★"
              done={done}
              total={quests.length}
              collapsed={collapsed}
              onToggle={() => toggle(group)}
            />
            {!collapsed && (
              <div className="space-y-1.5">
                {quests.map((m) => (
                  <MilestoneCard key={m._id} milestone={m} onToggleSubtask={onToggleSubtask} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {mainQuests.length === 0 && (
        <div className="glass-panel text-center py-8">
          <p className="text-sm text-slate-400">
            {query
              ? `No quests match “${search.trim()}”.`
              : `No main quests for age ${viewingAge} yet — level up and the next S-Rank gate will appear.`}
          </p>
        </div>
      )}

      {gearQuests.length > 0 && (
        <section className="space-y-1.5">
          <CollapsibleCategoryHeader
            title={GEAR_SECTION}
            icon="⚔"
            done={gearQuests.filter((q) => q.isCompleted).length}
            total={gearQuests.length}
            collapsed={isCollapsed(GEAR_SECTION)}
            onToggle={() => toggle(GEAR_SECTION)}
          />
          {!isCollapsed(GEAR_SECTION) && (
            <div className="space-y-1.5">
              {gearQuests.map((m) => (
                <MilestoneCard key={m._id} milestone={m} onToggleSubtask={onToggleSubtask} />
              ))}
            </div>
          )}
        </section>
      )}

      {milestones.length === 0 && (
        <div className="glass-panel text-center py-10">
          <p className="text-sm text-slate-400">
            Quest Board is empty — run the seed script to awaken your S-Rank gates.
          </p>
        </div>
      )}
    </div>
  );
}

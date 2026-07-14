'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Milestone } from '@/types';
import MilestoneCard from '@/components/milestones/MilestoneCard';

const MAIN_QUEST_CATEGORY = 'Level 20 Main Quest';

interface QuestBoardTabProps {
  milestones: Milestone[];
  currentAge: number;
  onAgeChange: (age: number) => void;
  onToggleSubtask: (milestoneId: string, subtaskId: string) => void;
}

function isMainQuest(m: Milestone) {
  return m.category === MAIN_QUEST_CATEGORY;
}

/** Soft thematic buckets for S-Rank gates based on title keywords. */
function inferGroup(title: string): string {
  const t = title.toLowerCase();
  if (/license|job|credit|debt|budget|fund|invest|retirement|pay/.test(t)) return 'Career & Finance';
  if (/cook|dentist|checkup|blood|cpr|sleep|health/.test(t)) return 'Health & Vitality';
  return 'Personal Growth';
}

export default function QuestBoardTab({
  milestones,
  currentAge,
  onAgeChange,
  onToggleSubtask,
}: QuestBoardTabProps) {
  const [viewingAge, setViewingAge] = useState(currentAge);
  const [ageDraft, setAgeDraft] = useState(String(currentAge));
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

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

  const mainQuests = milestones.filter((m) => isMainQuest(m) && m.ageGoal === viewingAge);
  const gearQuests = milestones.filter((m) => m.category === 'SSR Gear Quest');
  const completed = mainQuests.filter((m) => m.isCompleted).length;

  const grouped = useMemo(() => {
    const map = new Map<string, Milestone[]>();
    for (const m of mainQuests) {
      const g = inferGroup(m.title);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(m);
    }
    return [...map.entries()];
  }, [mainQuests]);

  const commitAge = () => {
    const parsed = parseInt(ageDraft, 10);
    if (!Number.isNaN(parsed) && parsed >= 10 && parsed <= 120 && parsed !== currentAge) {
      onAgeChange(parsed);
      setViewingAge(parsed);
    } else {
      setAgeDraft(String(currentAge));
    }
  };

  const toggleGroup = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="tab-content space-y-2.5">
      <div className="glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-2 !py-2.5">
        <div>
          <p className="panel-label">The Quest Board</p>
          <p className="text-meta mt-0.5">Long-term S-Rank gates & achievements</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-1.5 text-slate-500">
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

          <span className="text-[11px] text-slate-500">
            Cleared{' '}
            <span className="text-neon-teal font-bold font-mono-data">
              {completed}/{mainQuests.length}
            </span>
          </span>
        </div>
      </div>

      {grouped.map(([group, quests]) => {
        const isCollapsed = collapsed[group];
        return (
          <section key={group} className="space-y-1.5">
            <button
              type="button"
              onClick={() => toggleGroup(group)}
              className="category-sticky w-full justify-between pr-1"
            >
              <span className="flex items-center gap-1.5">
                <span>★</span> {group}
                <span className="text-slate-600 font-mono-data normal-case tracking-normal">
                  ({quests.filter((q) => q.isCompleted).length}/{quests.length})
                </span>
              </span>
              <span>{isCollapsed ? '▶' : '▼'}</span>
            </button>
            {!isCollapsed && (
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
            No main quests for age {viewingAge} yet — level up and the next S-Rank gate will appear.
          </p>
        </div>
      )}

      {gearQuests.length > 0 && (
        <section className="space-y-1.5">
          <h2 className="category-sticky">
            <span>⚔</span> SSR Gear Quests
          </h2>
          <div className="space-y-1.5">
            {gearQuests.map((m) => (
              <MilestoneCard key={m._id} milestone={m} onToggleSubtask={onToggleSubtask} />
            ))}
          </div>
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

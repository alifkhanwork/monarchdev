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

export default function QuestBoardTab({
  milestones,
  currentAge,
  onAgeChange,
  onToggleSubtask,
}: QuestBoardTabProps) {
  const [viewingAge, setViewingAge] = useState(currentAge);
  const [ageDraft, setAgeDraft] = useState(String(currentAge));

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

  const mainQuests = milestones.filter(
    (m) => isMainQuest(m) && m.ageGoal === viewingAge
  );
  const gearQuests = milestones.filter((m) => m.category === 'SSR Gear Quest');
  const completed = mainQuests.filter((m) => m.isCompleted).length;

  const commitAge = () => {
    const parsed = parseInt(ageDraft, 10);
    if (!Number.isNaN(parsed) && parsed >= 10 && parsed <= 120 && parsed !== currentAge) {
      onAgeChange(parsed);
      setViewingAge(parsed);
    } else {
      setAgeDraft(String(currentAge));
    }
  };

  return (
    <div className="tab-content space-y-4">
      <div className="glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="panel-label">The Quest Board</p>
          <p className="text-sm text-slate-400 mt-1">Long-term S-Rank gates & achievements</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2 text-slate-500">
            <span className="text-[10px] uppercase tracking-wider">Your age</span>
            <input
              type="number"
              min={10}
              max={120}
              value={ageDraft}
              onChange={(e) => setAgeDraft(e.target.value)}
              onBlur={commitAge}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="quest-log-input w-14 text-center"
              aria-label="Your current age"
            />
          </label>

          <label className="flex items-center gap-2 text-slate-500">
            <span className="text-[10px] uppercase tracking-wider">View</span>
            <select
              value={viewingAge}
              onChange={(e) => setViewingAge(Number(e.target.value))}
              className="text-xs bg-slate-950/70 border border-cyan-500/25 rounded px-2 py-1.5 text-cyan-300 focus:outline-none focus:border-cyan-400/50 font-semibold"
              aria-label="View quests by age"
            >
              {(availableAges.length > 0 ? availableAges : [currentAge]).map((age) => (
                <option key={age} value={age}>
                  Age {age}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Cleared</span>
            <span className="text-cyan-300 font-bold tabular-nums">
              {completed}/{mainQuests.length}
            </span>
          </div>
        </div>
      </div>

      {mainQuests.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80 mb-3 px-1">
            <span>★</span> Level {viewingAge} Main Quests
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mainQuests.map((m) => (
              <MilestoneCard key={m._id} milestone={m} onToggleSubtask={onToggleSubtask} />
            ))}
          </div>
        </section>
      )}

      {mainQuests.length === 0 && (
        <div className="glass-panel text-center py-10">
          <p className="text-slate-500 text-sm">
            No main quests for age {viewingAge} yet. Check back when you level up.
          </p>
        </div>
      )}

      {gearQuests.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400/80 mb-3 px-1">
            <span>⚔</span> SSR Gear Quests
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gearQuests.map((m) => (
              <MilestoneCard key={m._id} milestone={m} onToggleSubtask={onToggleSubtask} />
            ))}
          </div>
        </section>
      )}

      {milestones.length === 0 && (
        <div className="glass-panel text-center py-16">
          <p className="text-slate-500 text-sm">No milestones found. Run the backend seed script.</p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { CustomQuest, CustomQuestStat } from '@/lib/customQuestsStorage';
import { addCustomQuest, updateCustomQuest } from '@/lib/customQuestsStorage';
import { LIMITS, validateCustomQuestTitle } from '@/lib/inputValidation';

const STATS: { value: CustomQuestStat; label: string }[] = [
  { value: 'strength', label: 'STR' },
  { value: 'intelligence', label: 'INT' },
  { value: 'perception', label: 'PER' },
  { value: 'vitality', label: 'VIT' },
  { value: 'agility', label: 'AGI' },
];

interface CustomQuestFormProps {
  onCreated: (quest: CustomQuest) => void;
  onCancel: () => void;
  editing?: CustomQuest | null;
  onUpdated?: (quest: CustomQuest) => void;
}

export default function CustomQuestForm({
  onCreated,
  onCancel,
  editing = null,
  onUpdated,
}: CustomQuestFormProps) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [expReward, setExpReward] = useState(editing?.expReward ?? 15);
  const [statModifier, setStatModifier] = useState<CustomQuestStat>(
    editing?.statModifier ?? 'vitality'
  );
  const [targetCount, setTargetCount] = useState(
    editing?.targetCount != null ? String(editing.targetCount) : ''
  );
  const [recurring, setRecurring] = useState(Boolean(editing?.recurring));
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const titleCheck = validateCustomQuestTitle(title);
    if (!titleCheck.ok) {
      setError(titleCheck.message);
      return;
    }

    const exp = Number(expReward);
    if (
      !Number.isFinite(exp) ||
      exp < LIMITS.customQuestExpMin ||
      exp > LIMITS.customQuestExpMax
    ) {
      setError(`EXP must be between ${LIMITS.customQuestExpMin} and ${LIMITS.customQuestExpMax}`);
      return;
    }

    let target: number | undefined;
    if (targetCount.trim()) {
      const t = Number(targetCount);
      if (!Number.isFinite(t) || t < 1 || t > LIMITS.customQuestTargetMax) {
        setError(`Target must be between 1 and ${LIMITS.customQuestTargetMax.toLocaleString()}`);
        return;
      }
      target = Math.floor(t);
    }

    const payload = {
      title: titleCheck.title,
      expReward: Math.max(LIMITS.customQuestExpMin, Math.min(LIMITS.customQuestExpMax, Math.round(exp))),
      statModifier,
      targetCount: target,
      recurring,
    };

    if (editing) {
      const updated = updateCustomQuest(editing.id, payload);
      if (updated) onUpdated?.(updated);
      return;
    }

    const quest = addCustomQuest(payload);
    onCreated(quest);
  };

  return (
    <form
      onSubmit={submit}
      className="rounded border border-cyan-500/25 bg-slate-950/50 p-3 space-y-2 animate-fade-in"
    >
      <p className="panel-label">{editing ? 'Edit Custom Quest' : 'Add Custom Quest'}</p>
      <p className="text-meta">
        {recurring
          ? 'Recurring — reappears each day unchecked (local only; toast EXP is cosmetic).'
          : editing
            ? 'One-off — edits do not change already-earned server EXP.'
            : 'Today only — does not alter your recurring daily protocol.'}
      </p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, LIMITS.customQuestTitleMax))}
        placeholder="Quest title"
        maxLength={LIMITS.customQuestTitleMax}
        className="w-full text-sm bg-slate-950/70 border border-cyan-500/25 rounded px-2.5 py-2 text-white focus:outline-none focus:border-cyan-400/50"
        autoFocus
      />
      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-1.5 text-meta">
          EXP
          <input
            type="number"
            min={LIMITS.customQuestExpMin}
            max={LIMITS.customQuestExpMax}
            value={expReward}
            onChange={(e) => setExpReward(Number(e.target.value))}
            className="quest-log-input w-14 text-center"
          />
        </label>
        <label className="flex items-center gap-1.5 text-meta">
          Stat
          <select
            value={statModifier}
            onChange={(e) => setStatModifier(e.target.value as CustomQuestStat)}
            className="text-[11px] bg-slate-950/70 border border-cyan-500/25 rounded px-2 py-1.5 text-cyan-300"
          >
            {STATS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-meta">
          Target
          <input
            type="number"
            min={1}
            max={LIMITS.customQuestTargetMax}
            value={targetCount}
            onChange={(e) => setTargetCount(e.target.value)}
            placeholder="opt"
            className="quest-log-input w-14 text-center"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-meta cursor-pointer select-none min-h-[36px]">
        <input
          type="checkbox"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
          className="quest-native-checkbox"
        />
        Make recurring (shows every day)
      </label>
      {error && <p className="text-[12px] text-amber-300">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="journal-action-btn journal-action-btn-muted">
          Cancel
        </button>
        <button
          type="submit"
          disabled={title.trim().length < LIMITS.customQuestTitleMin}
          className="journal-action-btn"
        >
          {editing ? 'Save' : 'Add Quest'}
        </button>
      </div>
    </form>
  );
}

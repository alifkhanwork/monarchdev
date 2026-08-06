'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/types';
import type { ShopResponse } from '@/types';
import { THEME_ACCENTS, type ThemeAccentId } from '@/lib/themeAccent';
import type { WeightUnit } from '@/lib/weightUnits';

interface SettingsTabProps {
  user: User;
  onSettingsChange: (
    settings: NonNullable<User['settings']>,
    extra?: { email?: string }
  ) => void;
  onThemeEquipped: (accent: string | null) => void;
  onReplayOnboarding: () => void;
}

export default function SettingsTab({
  user,
  onSettingsChange,
  onThemeEquipped,
  onReplayOnboarding,
}: SettingsTabProps) {
  const weightUnit = user.settings?.weightUnit === 'lbs' ? 'lbs' : 'kg';
  const weekStartsOn = user.settings?.weekStartsOn === 0 ? 0 : 1;
  const digestEnabled = user.settings?.weeklyDigestEnabled !== false;
  const [emailDraft, setEmailDraft] = useState(user.email || '');
  const [saving, setSaving] = useState(false);
  const [shop, setShop] = useState<ShopResponse | null>(null);
  const [themeBusy, setThemeBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setEmailDraft(user.email || '');
  }, [user.email]);

  const loadShop = useCallback(async () => {
    try {
      const data = await api.getShop();
      setShop(data);
    } catch {
      // shop optional for theme equip list
    }
  }, []);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  const patchSettings = async (patch: {
    weightUnit?: WeightUnit;
    weekStartsOn?: 0 | 1;
    weeklyDigestEnabled?: boolean;
    fiveDaysStraight?: boolean;
    email?: string;
  }) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.updateSettings(patch);
      onSettingsChange(res.settings, { email: res.email });
      setMessage('Settings saved');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const equipTheme = async (accent: ThemeAccentId) => {
    setThemeBusy(accent ?? 'default');
    try {
      const res = await api.equipShopTheme(accent);
      onThemeEquipped(res.activeThemeAccent);
      setShop((prev) =>
        prev ? { ...prev, activeThemeAccent: res.activeThemeAccent } : prev
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to equip accent');
    } finally {
      setThemeBusy(null);
    }
  };

  const ownedThemes =
    shop?.items.filter((i) => i.type === 'theme' && i.owned) ??
    (user.ownedShopItems || [])
      .filter((id) => id.startsWith('accent_'))
      .map((id) => ({
        id,
        payload: id.replace('accent_', '') as 'crimson' | 'violet',
        name: id,
        owned: true,
        type: 'theme' as const,
      }));

  const activeAccent = shop?.activeThemeAccent ?? user.activeThemeAccent ?? null;

  return (
    <div className="tab-content space-y-2.5 max-w-xl">
      <div className="glass-panel !py-3">
        <p className="panel-label">Hunter Settings</p>
        <p className="text-meta mt-1">
          Preferences sync to your hunter profile on the server.
        </p>
      </div>

      <section className="glass-panel space-y-3">
        <div>
          <p className="panel-label">Weight units</p>
          <p className="text-meta mb-2">Applied to workout logging and volume displays.</p>
          <div className="inline-flex rounded border border-cyan-500/25 p-0.5 bg-slate-950/50">
            {(['kg', 'lbs'] as const).map((u) => (
              <button
                key={u}
                type="button"
                disabled={saving}
                onClick={() => patchSettings({ weightUnit: u })}
                className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded min-h-[36px] ${
                  weightUnit === u
                    ? 'bg-cyan-500/20 text-neon-teal'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="panel-label">Week starts on</p>
          <p className="text-meta mb-2">
            Controls streak heatmap columns. Grind mission resets stay Monday server-side.
          </p>
          <div className="inline-flex rounded border border-cyan-500/25 p-0.5 bg-slate-950/50">
            {(
              [
                { v: 1 as const, label: 'Monday' },
                { v: 0 as const, label: 'Sunday' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.v}
                type="button"
                disabled={saving}
                onClick={() => patchSettings({ weekStartsOn: opt.v })}
                className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded min-h-[36px] ${
                  weekStartsOn === opt.v
                    ? 'bg-cyan-500/20 text-neon-teal'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="panel-label">Workout Frequency Mode</p>
          <p className="text-meta mb-2">
            Higher-frequency option: removes the second rest day on Sunday so the 5-day PPL×UL split repeats sooner.
          </p>
          <div className="inline-flex rounded border border-cyan-500/25 p-0.5 bg-slate-950/50">
            {[
              { val: false, label: 'Standard (5-Day + 2 Rest)' },
              { val: true, label: '5-Days-Straight (Higher Frequency)' },
            ].map((opt) => (
              <button
                key={String(opt.val)}
                type="button"
                disabled={saving}
                onClick={() => patchSettings({ fiveDaysStraight: opt.val })}
                className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded min-h-[36px] ${
                  Boolean(user.settings?.fiveDaysStraight) === opt.val
                    ? 'bg-cyan-500/20 text-neon-teal'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-panel space-y-3">
        <div>
          <p className="panel-label">Weekly email digest</p>
          <p className="text-meta mb-2">
            Sunday summary of clears, streak, and weekly missions (Resend). Opt out anytime.
          </p>
          <label className="block text-meta mb-1" htmlFor="digest-email">
            Email
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="digest-email"
              type="email"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              placeholder="hunter@example.com"
              className="flex-1 min-w-[180px] text-sm bg-slate-950/70 border border-cyan-500/25 rounded px-2.5 py-2 text-white"
            />
            <button
              type="button"
              disabled={saving}
              className="journal-action-btn"
              onClick={() => patchSettings({ email: emailDraft.trim() })}
            >
              Save email
            </button>
          </div>
          <label className="flex items-center gap-2 mt-3 text-meta cursor-pointer min-h-[36px]">
            <input
              type="checkbox"
              checked={digestEnabled}
              disabled={saving}
              onChange={(e) => patchSettings({ weeklyDigestEnabled: e.target.checked })}
              className="quest-native-checkbox"
            />
            Send weekly digest
          </label>
        </div>
      </section>

      <section className="glass-panel space-y-2">
        <p className="panel-label">Cosmetic accent</p>
        <p className="text-meta">
          Equip themes owned from the EXP Reward Shop. Default is System cyan.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={themeBusy != null}
            onClick={() => equipTheme(null)}
            className={`journal-action-btn ${!activeAccent ? '' : 'journal-action-btn-muted'}`}
          >
            {themeBusy === 'default' ? '…' : !activeAccent ? 'Default · active' : 'Default cyan'}
          </button>
          {(ownedThemes as { id: string; payload: string; name?: string }[]).map((item) => {
            const key = item.payload === 'crimson' || item.payload === 'violet' ? item.payload : null;
            if (!key) return null;
            const meta = THEME_ACCENTS[key];
            const active = activeAccent === key;
            return (
              <button
                key={item.id}
                type="button"
                disabled={themeBusy != null}
                onClick={() => equipTheme(key)}
                className={`journal-action-btn ${active ? '' : 'journal-action-btn-muted'}`}
                style={active ? { borderColor: meta.hex } : undefined}
              >
                {themeBusy === key ? '…' : active ? `${meta.label} · active` : meta.label}
              </button>
            );
          })}
        </div>
        {ownedThemes.length === 0 && (
          <p className="text-meta">No premium accents owned yet — unlock them in the shop.</p>
        )}
      </section>

      <section className="glass-panel space-y-2">
        <p className="panel-label">Onboarding</p>
        <button type="button" className="journal-action-btn" onClick={onReplayOnboarding}>
          Replay tutorial
        </button>
      </section>

      {message && <p className="text-meta text-neon-teal px-1">{message}</p>}
    </div>
  );
}

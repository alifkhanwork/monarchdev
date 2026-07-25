'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ShopResponse } from '@/types';
import { PanelSkeleton } from '@/components/ui/Skeleton';

interface RewardShopSectionProps {
  onPurchased?: (result?: {
    availableTitles?: string[];
    activeThemeAccent?: string | null;
  }) => void;
  onThemeEquipped?: (accent: string | null) => void;
}

export default function RewardShopSection({
  onPurchased,
  onThemeEquipped,
}: RewardShopSectionProps) {
  const [shop, setShop] = useState<ShopResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.getShop();
      setShop(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load shop');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const purchase = async (itemId: string) => {
    setBusyId(itemId);
    setError(null);
    try {
      const res = await api.purchaseShopItem(itemId);
      setShop(res.shop);
      onPurchased?.({
        availableTitles: res.availableTitles,
        activeThemeAccent: res.shop.activeThemeAccent,
      });
      if (res.shop.activeThemeAccent != null) {
        onThemeEquipped?.(res.shop.activeThemeAccent);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Purchase failed');
    } finally {
      setBusyId(null);
    }
  };

  const equipTheme = async (accent: string | null) => {
    setBusyId(accent ? `equip-${accent}` : 'equip-default');
    setError(null);
    try {
      const res = await api.equipShopTheme(accent);
      setShop((prev) =>
        prev ? { ...prev, activeThemeAccent: res.activeThemeAccent } : prev
      );
      onThemeEquipped?.(res.activeThemeAccent);
      onPurchased?.({ activeThemeAccent: res.activeThemeAccent });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to equip accent');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel flex justify-center py-6">
        <PanelSkeleton rows={4} className="w-full !border-0 !bg-transparent !p-0" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="glass-panel text-center py-4">
        <p className="text-sm text-slate-400">{error || 'Shop unavailable'}</p>
      </div>
    );
  }

  const ownedThemes = shop.items.filter((i) => i.type === 'theme' && i.owned);
  const hasAnyTheme = ownedThemes.length > 0;

  return (
    <div className="glass-panel space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="panel-label">EXP Reward Shop</p>
          <p className="text-meta mt-0.5">Spend earned EXP credits on cosmetics & tokens</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Balance</p>
          <p className="text-lg font-bold font-mono-data text-amber-300">{shop.spendableExp} EXP</p>
          {shop.cheatDayTokens > 0 && (
            <p className="text-[10px] text-neon-teal/90 font-mono-data">
              {shop.cheatDayTokens} cheat token{shop.cheatDayTokens === 1 ? '' : 's'}
            </p>
          )}
        </div>
      </div>

      {error && <p className="text-[12px] text-red-300">{error}</p>}

      {hasAnyTheme && (
        <div className="rounded-lg border border-cyan-500/15 bg-slate-950/40 px-3 py-2.5 space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Equipped accent</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`journal-action-btn !min-h-[32px] !text-[11px] ${
                !shop.activeThemeAccent ? '!border-neon-teal/50 !text-neon-teal' : ''
              }`}
              disabled={busyId === 'equip-default' || !shop.activeThemeAccent}
              onClick={() => equipTheme(null)}
            >
              {!shop.activeThemeAccent ? 'Default · active' : 'Default cyan'}
            </button>
            {ownedThemes.map((item) => {
              const active = shop.activeThemeAccent === item.payload;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`journal-action-btn !min-h-[32px] !text-[11px] ${
                    active ? '!border-neon-teal/50 !text-neon-teal' : ''
                  }`}
                  disabled={active || busyId === `equip-${item.payload}`}
                  onClick={() => equipTheme(item.payload)}
                >
                  {active ? `${item.name.replace(/^Accent:\s*/i, '')} · active` : item.name.replace(/^Accent:\s*/i, '')}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {shop.items.map((item) => {
          const isTheme = item.type === 'theme';
          const isActiveTheme =
            isTheme && item.owned && shop.activeThemeAccent === item.payload;

          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-cyan-500/15 bg-slate-950/40 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{item.name}</p>
                <p className="text-meta mt-0.5">{item.description}</p>
                <p className="text-[11px] font-mono-data text-amber-300/90 mt-1">{item.cost} EXP</p>
                {isActiveTheme && (
                  <p className="text-[10px] text-neon-teal mt-1 uppercase tracking-wider">Equipped</p>
                )}
                {item.type === 'title' && item.owned && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Available in Equipped Title on Profile
                  </p>
                )}
                {item.type === 'token' && (
                  <p className="text-[10px] text-slate-500 mt-1 italic">
                    Stockpiled only — effect not wired yet
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0 items-stretch">
                <button
                  type="button"
                  className="journal-action-btn !min-h-[36px]"
                  disabled={
                    (item.owned && !item.stackable) ||
                    (!item.owned && !item.canAfford) ||
                    busyId === item.id
                  }
                  onClick={() => purchase(item.id)}
                >
                  {item.owned && !item.stackable
                    ? 'Owned'
                    : busyId === item.id
                      ? '…'
                      : item.canAfford
                        ? 'Buy'
                        : 'Locked'}
                </button>
                {isTheme && item.owned && !isActiveTheme && (
                  <button
                    type="button"
                    className="journal-action-btn !min-h-[32px] !text-[11px]"
                    disabled={busyId === `equip-${item.payload}`}
                    onClick={() => equipTheme(item.payload)}
                  >
                    Equip
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

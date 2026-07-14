import type { GearItem } from '@/types';

interface GearCardProps {
  item: GearItem | null;
  slot: 'weapon' | 'relic';
  emptyLabel: string;
}

const SLOT_STYLES = {
  weapon: {
    gradient: 'from-red-950/85 via-red-900/40 to-slate-950/80',
    border: 'border-red-500/45',
    accent: 'text-red-400',
    bar: 'bg-red-500',
    icon: '⚔',
  },
  relic: {
    gradient: 'from-blue-950/85 via-indigo-900/40 to-slate-950/80',
    border: 'border-blue-500/45',
    accent: 'text-blue-400',
    bar: 'bg-blue-500',
    icon: '✦',
  },
};

export default function GearCard({ item, slot, emptyLabel }: GearCardProps) {
  const style = SLOT_STYLES[slot];

  if (!item) {
    return (
      <div className="gear-card border-dashed border-slate-600/40 bg-slate-900/30 !min-h-[72px]">
        <p className="text-[13px] text-slate-500">{emptyLabel}</p>
      </div>
    );
  }

  const multipliers = Object.entries(item.statMultiplier || {})
    .filter(([, v]) => v && v !== 1)
    .map(([k, v]) => {
      const pct = Math.round(((v as number) - 1) * 100);
      return `${k.slice(0, 3).toUpperCase()} ${pct >= 0 ? '+' : ''}${pct}%`;
    });

  return (
    <div
      className={`gear-card bg-gradient-to-br ${style.gradient} ${style.border} !min-h-[90px] !p-2.5`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-base ${style.accent} shrink-0`}>{style.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 min-w-0">
            <h4 className={`text-[13px] font-bold ${style.accent} truncate`}>{item.name}</h4>
            <span className="text-[9px] text-slate-500 uppercase shrink-0">{item.type}</span>
          </div>
          {multipliers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {multipliers.map((m) => (
                <span
                  key={m}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-black/35 border border-white/10 text-slate-200 font-mono-data"
                >
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/15 text-slate-400 shrink-0">
          {item.rarity}
        </span>
      </div>
      {item.description && (
        <p className="text-[10px] text-slate-500 leading-snug line-clamp-1 mt-1.5">{item.description}</p>
      )}
      <div className="mt-2 h-1 rounded-full bg-black/40 overflow-hidden">
        <div className={`h-full w-3/4 rounded-full ${style.bar}`} />
      </div>
    </div>
  );
}

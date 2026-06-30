import type { GearItem } from '@/types';

interface GearCardProps {
  item: GearItem | null;
  slot: 'weapon' | 'relic';
  emptyLabel: string;
}

const SLOT_STYLES = {
  weapon: {
    gradient: 'from-red-950/80 via-red-900/40 to-slate-900/60',
    border: 'border-red-500/50',
    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.2)]',
    accent: 'text-red-400',
    badge: 'bg-red-600/80 border-red-400/60 text-white',
    icon: '⚔',
    clip: 'gear-card-weapon',
  },
  relic: {
    gradient: 'from-blue-950/80 via-indigo-900/40 to-slate-900/60',
    border: 'border-blue-500/50',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.2)]',
    accent: 'text-blue-400',
    badge: 'bg-blue-600/80 border-blue-400/60 text-white',
    icon: '✦',
    clip: 'gear-card-relic',
  },
};

const RARITY_COLORS: Record<string, string> = {
  R: 'text-slate-300 border-slate-500/50 bg-slate-700/50',
  SR: 'text-purple-300 border-purple-500/50 bg-purple-900/40',
  SSR: 'text-amber-300 border-amber-500/50 bg-amber-900/40',
};

export default function GearCard({ item, slot, emptyLabel }: GearCardProps) {
  const style = SLOT_STYLES[slot];

  if (!item) {
    return (
      <div className={`gear-card ${style.clip} border-dashed border-slate-600/40 bg-slate-900/30`}>
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      </div>
    );
  }

  const multipliers = Object.entries(item.statMultiplier || {})
    .filter(([, v]) => v && v !== 1)
    .map(([k, v]) => `${k.slice(0, 3).toUpperCase()} ×${v}`);

  return (
    <div
      className={`gear-card ${style.clip} bg-gradient-to-br ${style.gradient} ${style.border} ${style.glow}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${RARITY_COLORS[item.rarity]}`}>
          {item.rarity}
        </span>
        <span className={`text-2xl ${style.accent}`}>{style.icon}</span>
      </div>

      <h4 className={`text-base font-bold ${style.accent} leading-tight mb-1`}>{item.name}</h4>
      <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-3">{item.type}</p>

      {multipliers.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {multipliers.map((m) => (
            <span
              key={m}
              className="text-[9px] px-1.5 py-0.5 rounded bg-black/30 border border-white/10 text-slate-300"
            >
              {m}
            </span>
          ))}
        </div>
      )}

      {item.description && (
        <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{item.description}</p>
      )}

      <div className="mt-auto pt-3 border-t border-white/5">
        <div className="h-1 rounded-full bg-black/40 overflow-hidden">
          <div className={`h-full w-3/4 rounded-full ${slot === 'weapon' ? 'bg-red-500' : 'bg-blue-500'}`} />
        </div>
        <p className="text-[9px] text-slate-600 mt-1 uppercase tracking-wider">Equipped</p>
      </div>
    </div>
  );
}

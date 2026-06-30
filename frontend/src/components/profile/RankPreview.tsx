import type { RankInfo } from '@/types';

interface RankPreviewProps {
  currentTitle: string;
  nextRank: RankInfo | null;
  level: number;
  totalPower: number;
}

export default function RankPreview({ currentTitle, nextRank, level, totalPower }: RankPreviewProps) {
  if (!nextRank) {
    return (
      <p className="text-xs text-amber-400/80 mt-2">
        <span className="text-slate-500">Rank:</span> {currentTitle} — Maximum rank achieved
      </p>
    );
  }

  const levelMet = level >= nextRank.level;
  const powerMet = totalPower >= nextRank.totalPower;

  return (
    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
      <span className="text-slate-500">Next Rank:</span>{' '}
      <span className="text-amber-400 font-semibold">{nextRank.name}</span>
      {' — requires '}
      <span className={levelMet ? 'text-emerald-400' : 'text-cyan-300'}>Level {nextRank.level}</span>
      {' / '}
      <span className={powerMet ? 'text-emerald-400' : 'text-cyan-300'}>
        {nextRank.totalPower.toLocaleString()} Total Power
      </span>
    </p>
  );
}

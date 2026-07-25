'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import type { UserStats } from '@/types';

interface StatRadarChartProps {
  stats: UserStats;
  effectiveStats?: UserStats;
  /** Compact variant for gear column / always-visible Overview. */
  compact?: boolean;
}

const STAT_META: { key: keyof UserStats; label: string; hint: string }[] = [
  { key: 'strength', label: 'STR', hint: 'Workouts' },
  { key: 'vitality', label: 'VIT', hint: 'Sleep · water · nutrition' },
  { key: 'intelligence', label: 'INT', hint: 'Study · portfolio' },
  { key: 'perception', label: 'PER', hint: 'Journal · reading' },
  { key: 'agility', label: 'AGI', hint: 'Cardio · recovery' },
];

export default function StatRadarChart({
  stats,
  effectiveStats,
  compact = false,
}: StatRadarChartProps) {
  const display = effectiveStats ?? stats;

  const data = STAT_META.map((m) => ({
    stat: m.label,
    value: Number(display[m.key] ?? 10),
    base: Number(stats[m.key] ?? 10),
  }));

  const maxVal = Math.max(20, ...data.map((d) => d.value), ...data.map((d) => d.base));
  const domainMax = Math.ceil(maxVal / 10) * 10;
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const hasGearBoost = data.some((d) => d.value !== d.base);

  return (
    <div className={`relative w-full mx-auto ${compact ? 'max-w-[200px]' : 'max-w-[260px]'} aspect-square`}>
      <div className="absolute inset-[8%] rounded-full border border-cyan-500/10" />
      <div className="absolute inset-[18%] rounded-full border border-cyan-500/15" />
      <div className="absolute inset-[28%] rounded-full border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.08)]" />

      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius={compact ? '68%' : '72%'} data={data}>
          <PolarGrid stroke="rgba(34, 211, 238, 0.22)" gridType="polygon" />
          <PolarAngleAxis
            dataKey="stat"
            tick={{ fill: '#67e8f9', fontSize: compact ? 10 : 11, fontWeight: 700 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, domainMax]}
            tick={false}
            axisLine={false}
          />
          {hasGearBoost && (
            <Radar
              name="Base"
              dataKey="base"
              stroke="rgba(148, 163, 184, 0.55)"
              fill="rgba(148, 163, 184, 0.08)"
              fillOpacity={1}
              strokeWidth={1}
              dot={false}
              isAnimationActive={false}
            />
          )}
          <Radar
            name="Effective"
            dataKey="value"
            stroke="#22d3ee"
            fill="rgba(34, 211, 238, 0.22)"
            fillOpacity={0.85}
            strokeWidth={2}
            dot={{ fill: '#22d3ee', r: compact ? 2.5 : 3 }}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-[9px] uppercase tracking-[0.3em] text-cyan-400/50">Stat Sum</p>
          <p className={`font-bold text-glow-cyan tabular-nums ${compact ? 'text-lg' : 'text-xl'}`}>
            {total}
          </p>
        </div>
      </div>
    </div>
  );
}

export { STAT_META };

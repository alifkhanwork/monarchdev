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
}

export default function StatRadarChart({ stats, effectiveStats }: StatRadarChartProps) {
  const display = effectiveStats ?? stats;

  const data = [
    { stat: 'STR', value: display.strength, fullMark: 100 },
    { stat: 'INT', value: display.intelligence, fullMark: 100 },
    { stat: 'PER', value: display.perception, fullMark: 100 },
    { stat: 'VIT', value: display.vitality, fullMark: 100 },
    { stat: 'AGI', value: display.agility ?? stats.agility ?? 10, fullMark: 100 },
  ];

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="relative w-full max-w-[320px] mx-auto aspect-square">
      {/* Concentric rings */}
      <div className="absolute inset-[8%] rounded-full border border-cyan-500/10" />
      <div className="absolute inset-[18%] rounded-full border border-cyan-500/15" />
      <div className="absolute inset-[28%] rounded-full border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.08)]" />

      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
          <PolarGrid stroke="rgba(34, 211, 238, 0.2)" gridType="polygon" />
          <PolarAngleAxis
            dataKey="stat"
            tick={{ fill: '#67e8f9', fontSize: 11, fontWeight: 700 }}
          />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Stats"
            dataKey="value"
            stroke="#22d3ee"
            fill="rgba(34, 211, 238, 0.2)"
            fillOpacity={0.7}
            strokeWidth={2}
            dot={{ fill: '#22d3ee', r: 3 }}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-[9px] uppercase tracking-[0.3em] text-cyan-400/50">Stat Sum</p>
          <p className="text-xl font-bold text-glow-cyan tabular-nums">{total}</p>
        </div>
      </div>
    </div>
  );
}

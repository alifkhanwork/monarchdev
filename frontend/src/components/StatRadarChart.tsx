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
}

export default function StatRadarChart({ stats }: StatRadarChartProps) {
  const data = [
    { stat: 'STR', value: stats.strength, fullMark: 100 },
    { stat: 'INT', value: stats.intelligence, fullMark: 100 },
    { stat: 'PER', value: stats.perception, fullMark: 100 },
    { stat: 'VIT', value: stats.vitality, fullMark: 100 },
  ];

  return (
    <div className="relative w-full aspect-square max-w-[280px] mx-auto">
      <div className="absolute inset-0 rounded-full border border-system-glow/20 shadow-glow" />
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid
            stroke="rgba(59, 158, 255, 0.15)"
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="stat"
            tick={{ fill: '#4fc3f7', fontSize: 12, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={45}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Stats"
            dataKey="value"
            stroke="#3b9eff"
            fill="rgba(59, 158, 255, 0.25)"
            fillOpacity={0.6}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-system-muted">Total</p>
          <p className="text-lg font-bold text-system-gold">
            {stats.strength + stats.intelligence + stats.perception + stats.vitality}
          </p>
        </div>
      </div>
    </div>
  );
}

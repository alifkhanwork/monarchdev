'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { StatHistoryEntry, UserStats } from '@/types';
import { localDateKey } from '@/lib/dateHelpers';

interface PerformanceOverviewChartProps {
  history: StatHistoryEntry[];
  currentPower: number;
  level: number;
}

type Point = { date: string; label: string; power: number };

const MIN_POINTS_FOR_CHART = 5;

function estimatePower(stats: UserStats, level: number) {
  const sum =
    (stats.strength || 0) +
    (stats.intelligence || 0) +
    (stats.perception || 0) +
    (stats.vitality || 0) +
    (stats.agility || 0);
  return sum * 10 + level * 50;
}

function powerFromEntry(entry: StatHistoryEntry, fallbackLevel: number) {
  if (typeof entry.totalPower === 'number' && Number.isFinite(entry.totalPower)) {
    return Math.round(entry.totalPower);
  }
  return Math.round(estimatePower(entry.stats, entry.level ?? fallbackLevel));
}

function shortLabel(dateKey: string) {
  const d = new Date(`${dateKey}T12:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildSeries(
  history: StatHistoryEntry[],
  currentPower: number,
  level: number
): Point[] {
  const todayKey = localDateKey();
  const byDate = new Map<string, number>();

  for (const entry of [...history].sort((a, b) => a.date.localeCompare(b.date))) {
    if (!entry?.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) continue;
    byDate.set(entry.date, powerFromEntry(entry, level));
  }
  byDate.set(todayKey, currentPower);

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, power]) => ({
      date,
      label: shortLabel(date),
      power,
    }));
}

function deltaFromSeries(points: Point[], daysBack: number) {
  if (points.length < 2) return 0;
  const end = points[points.length - 1];
  const endDate = new Date(`${end.date}T12:00:00`);
  const cutoff = new Date(endDate);
  cutoff.setDate(cutoff.getDate() - daysBack);
  const cutoffKey = localDateKey(cutoff);

  let startPower = points[0].power;
  for (const p of points) {
    if (p.date <= cutoffKey) startPower = p.power;
  }
  return end.power - startPower;
}

export default function PerformanceOverviewChart({
  history,
  currentPower,
  level,
}: PerformanceOverviewChartProps) {
  const data = buildSeries(history, currentPower, level);
  const realSnapshotCount = history.filter((h) => h?.date).length;
  const hasEnoughData = data.length >= MIN_POINTS_FOR_CHART;

  const weekDelta = deltaFromSeries(data, 7);
  const monthDelta = deltaFromSeries(data, 30);
  const maxPower = Math.max(currentPower, ...data.map((p) => p.power), 200);
  const yMax = Math.max(200, Math.ceil(maxPower / 200) * 200);

  const fmtDelta = (n: number) => `${n >= 0 ? '+' : ''}${n.toLocaleString()}`;

  if (process.env.NODE_ENV === 'development') {
    // Helpful while validating empty-chart bugs — not shown in UI
    // eslint-disable-next-line no-console
    console.debug('[PerformanceOverview]', {
      historyLen: history.length,
      seriesLen: data.length,
      sample: data.slice(-5),
    });
  }

  if (!hasEnoughData) {
    return (
      <div className="flex flex-col justify-center min-h-[200px] rounded border border-dashed border-cyan-500/20 bg-slate-950/30 px-4 py-6 text-center">
        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-2">
          Performance Overview
        </p>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Not enough data yet — check back after a few days. The System now logs Total Power
          daily ({realSnapshotCount}/{MIN_POINTS_FOR_CHART} snapshots).
        </p>
        <p className="mt-3 text-2xl font-bold text-glow-gold font-mono-data">
          {currentPower.toLocaleString()}
          <span className="block text-[10px] text-slate-500 font-sans font-normal tracking-wider mt-1">
            Current Total Power
          </span>
        </p>
        {(weekDelta !== 0 || monthDelta !== 0) && data.length >= 2 && (
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-[11px] font-semibold text-neon-teal font-mono-data">
            <span>▲ {fmtDelta(weekDelta)} this week</span>
            <span>▲ {fmtDelta(monthDelta)} this month</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-2">
        Performance Overview (Last {data.length} Snapshots)
      </p>

      {/* Explicit height — ResponsiveContainer + flex/% height collapses to 0px */}
      <div className="w-full h-52 sm:h-56" style={{ minHeight: 208 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="powerFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.4} />
                <stop offset="85%" stopColor="#00E5FF" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#00E5FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(0,229,255,0.08)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={{ stroke: 'rgba(0,229,255,0.2)' }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              domain={[0, yMax]}
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={{ stroke: 'rgba(0,229,255,0.2)' }}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(5,10,20,0.96)',
                border: '1px solid rgba(0,229,255,0.35)',
                borderRadius: 8,
                fontSize: 12,
                color: '#e2e8f0',
              }}
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as Point | undefined;
                return row?.date ?? '';
              }}
              formatter={(value: number) => [value.toLocaleString(), 'Total Power']}
            />
            <Area
              type="monotone"
              dataKey="power"
              stroke="#00E5FF"
              strokeWidth={2.5}
              fill="url(#powerFill)"
              isAnimationActive
              dot={{ r: 3.5, fill: '#00E5FF', stroke: '#050a14', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: '#67e8f9', stroke: '#fff', strokeWidth: 1 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-3 sm:gap-5 mt-2 pt-2 border-t border-cyan-500/10">
        <p className="text-[11px] font-semibold text-neon-teal font-mono-data">
          ▲ {fmtDelta(weekDelta)} this week
        </p>
        <p className="text-[11px] font-semibold text-neon-teal/80 font-mono-data">
          ▲ {fmtDelta(monthDelta)} this month
        </p>
      </div>
    </div>
  );
}

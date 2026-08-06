'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface MoodPoint {
  dateKey: string;
  moodScore: number;
}

export default function MoodTrendChart() {
  const [points, setPoints] = useState<MoodPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMoodHistory() {
      try {
        setLoading(true);
        const res = await api.listJournals({ limit: 14 });
        const valid = (res.entries || [])
          .filter((e) => e.moodScore != null && e.moodScore >= 1 && e.moodScore <= 5)
          .map((e) => ({ dateKey: e.dateKey, moodScore: e.moodScore as number }))
          .reverse(); // chronological left to right
        setPoints(valid);
      } catch {
        // ignore error
      } finally {
        setLoading(false);
      }
    }
    loadMoodHistory();
  }, []);

  if (loading || points.length === 0) return null;

  // SVG Sparkline calculation
  const width = 360;
  const height = 90;
  const padding = 15;

  const minVal = 1;
  const maxVal = 5;

  const getX = (idx: number) => {
    if (points.length <= 1) return width / 2;
    return padding + (idx / (points.length - 1)) * (width - padding * 2);
  };

  const getY = (score: number) => {
    const ratio = (score - minVal) / (maxVal - minVal);
    return height - padding - ratio * (height - padding * 2);
  };

  const polylinePoints = points.map((p, i) => `${getX(i)},${getY(p.moodScore)}`).join(' ');

  return (
    <div className="glass-panel border-cyan-500/20">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="panel-label mb-0.5">Player Wellness</p>
          <h4 className="text-sm font-bold text-white tracking-wide">
            ⚡ Mood & Energy Trend (1–5 Scale)
          </h4>
        </div>
        <span className="text-[10px] font-mono-data text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
          Last {points.length} Entries
        </span>
      </div>

      <div className="w-full overflow-x-auto py-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
          {/* Horizontal Grid lines */}
          {[1, 3, 5].map((level) => {
            const y = getY(level);
            return (
              <line
                key={level}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Sparkline Line */}
          {points.length > 1 && (
            <polyline
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />
          )}

          {/* Data Points */}
          {points.map((p, i) => {
            const cx = getX(i);
            const cy = getY(p.moodScore);
            return (
              <g key={p.dateKey} className="group cursor-pointer">
                <circle cx={cx} cy={cy} r="4" fill="#00e5ff" stroke="#0f172a" strokeWidth="2" />
                <title>{`${p.dateKey}: ⚡ ${p.moodScore}/5`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Date Labels Underneath */}
      <div className="flex justify-between text-[9px] font-mono-data text-slate-400 px-1 pt-1 border-t border-slate-800">
        <span>{points[0]?.dateKey.slice(5)}</span>
        {points.length > 2 && (
          <span>{points[Math.floor(points.length / 2)]?.dateKey.slice(5)}</span>
        )}
        <span>{points[points.length - 1]?.dateKey.slice(5)}</span>
      </div>
    </div>
  );
}

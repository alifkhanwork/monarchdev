'use client';

interface StatSparklineProps {
  label: string;
  values: number[];
  current: number;
}

export default function StatSparkline({ label, values, current }: StatSparklineProps) {
  const data = values.length > 0 ? values : [current];
  const min = Math.min(...data, current) - 1;
  const max = Math.max(...data, current) + 1;
  const range = max - min || 1;
  const w = 80;
  const h = 28;

  const points = data
    .map((v, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border border-cyan-500/10 bg-slate-900/30">
      <span className="text-[9px] font-bold text-cyan-400/70 w-7">{label}</span>
      <svg width={w} height={h} className="flex-1 overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
        <circle
          cx={(data.length - 1) / Math.max(data.length - 1, 1) * w}
          cy={h - ((data[data.length - 1] - min) / range) * h}
          r="2"
          fill="#22d3ee"
        />
      </svg>
      <span className="text-xs font-bold text-white tabular-nums w-6 text-right">{current}</span>
    </div>
  );
}

'use client';

import type { TabConfig } from '@/types/tabs';

interface TabPlaceholderProps {
  tab: TabConfig;
}

export default function TabPlaceholder({ tab }: TabPlaceholderProps) {
  return (
    <div className="tab-content flex items-center justify-center min-h-[50dvh]">
      <div className="glass-panel max-w-md w-full text-center p-10">
        <span className="text-4xl block mb-4 opacity-60">{tab.icon}</span>
        <h2 className="text-xl font-bold text-white tracking-wide mb-2">{tab.label}</h2>
        <p className="text-sm text-slate-400 mb-4">{tab.description}</p>
        <p className="text-xs text-cyan-400/60 uppercase tracking-[0.2em]">
          Awaiting system deployment...
        </p>
      </div>
    </div>
  );
}

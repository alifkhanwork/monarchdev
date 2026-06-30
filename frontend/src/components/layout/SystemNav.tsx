'use client';

import type { TabId } from '@/types/tabs';
import { TABS } from '@/types/tabs';

interface SystemNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  username?: string;
  level?: number;
}

export default function SystemNav({ activeTab, onTabChange, username, level }: SystemNavProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-cyan-500/20 bg-slate-950/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Brand row */}
        <div className="flex items-center justify-between py-3 border-b border-cyan-500/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border border-cyan-400/40 bg-cyan-500/10 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.15)]">
              <img
                src="/crown.svg"
                alt=""
                width={20}
                height={20}
                className="drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                aria-hidden
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-widest text-white leading-none">
                THE DEV MONARCH
              </h1>
              <p className="text-[10px] text-cyan-400/60 uppercase tracking-[0.3em] mt-0.5">
                Hunter System Interface
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {username && (
              <span className="hidden md:block text-slate-400 truncate max-w-[180px]">
                {username}
              </span>
            )}
            {level !== undefined && (
              <span className="px-2.5 py-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-semibold tabular-nums shadow-glow">
                Lv. {level}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-emerald-400/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Online</span>
            </span>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex gap-1 py-2 overflow-x-auto custom-scrollbar" aria-label="Main navigation">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`nav-tab shrink-0 ${isActive ? 'nav-tab-active' : 'nav-tab-inactive'}`}
              >
                <span className="text-sm opacity-80">{tab.icon}</span>
                <span className="font-semibold tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

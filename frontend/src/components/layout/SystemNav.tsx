'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { TabId } from '@/types/tabs';
import { TABS } from '@/types/tabs';

interface SystemNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  username?: string;
  level?: number;
  equippedTitle?: string;
}

export default function SystemNav({
  activeTab,
  onTabChange,
  username,
  level,
  equippedTitle,
}: SystemNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const selectTab = (tab: TabId) => {
    onTabChange(tab);
    setMenuOpen(false);
  };

  useEffect(() => {
    if (!menuOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const drawer = drawerRef.current;
    const focusable = drawer?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];
    first?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key !== 'Tab' || !focusable?.length) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
      hamburgerRef.current?.focus();
    };
  }, [menuOpen, closeMenu]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-cyan-500/20 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-5">
          <div className="flex items-center justify-between py-2 sm:py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded border border-cyan-400/40 bg-cyan-500/10 flex items-center justify-center shrink-0">
                <img
                  src="/crown.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                  aria-hidden
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold tracking-widest text-white leading-none truncate">
                  THE DEV MONARCH
                </h1>
                {equippedTitle && (
                  <p className="text-[10px] text-amber-400/80 mt-0.5 truncate sm:hidden">
                    {equippedTitle}
                  </p>
                )}
                <p className="text-[9px] text-cyan-400/60 uppercase tracking-[0.25em] mt-0.5 hidden sm:block">
                  Hunter System Interface
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs shrink-0">
              {username && (
                <div className="hidden md:flex flex-col items-end min-w-0">
                  <span className="text-slate-300 truncate max-w-[180px]">{username}</span>
                  {equippedTitle && (
                    <span className="text-[10px] text-amber-400/80 italic truncate max-w-[180px]">
                      {equippedTitle}
                    </span>
                  )}
                </div>
              )}
              {level !== undefined && (
                <span className="px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-semibold font-mono-data">
                  Lv. {level}
                </span>
              )}
              <span className="hidden sm:flex items-center gap-1 text-emerald-400/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px]">Online</span>
              </span>

              <button
                ref={hamburgerRef}
                type="button"
                className="sm:hidden inline-flex items-center justify-center w-11 h-11 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                aria-label="Open navigation menu"
                aria-expanded={menuOpen}
                aria-controls="mobile-nav-drawer"
                onClick={() => setMenuOpen(true)}
              >
                <span className="flex flex-col gap-1.5" aria-hidden>
                  <span className="block w-4 h-0.5 bg-current rounded" />
                  <span className="block w-4 h-0.5 bg-current rounded" />
                  <span className="block w-4 h-0.5 bg-current rounded" />
                </span>
              </button>
            </div>
          </div>

          <nav
            className="hidden sm:flex gap-1 pb-2 overflow-x-auto custom-scrollbar"
            aria-label="Main navigation"
          >
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
                  <span className="font-semibold tracking-wide text-[13px]">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {menuOpen && (
        <>
          <button
            type="button"
            className="nav-drawer-backdrop sm:hidden"
            aria-label="Close navigation menu"
            onClick={closeMenu}
          />
          <div
            ref={drawerRef}
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="nav-drawer sm:hidden"
          >
            <div className="flex items-start justify-between gap-3 border-b border-cyan-500/15 pb-3 mb-3">
              <div className="min-w-0">
                <p id={titleId} className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/70">
                  Navigation
                </p>
                {username && (
                  <p className="text-sm font-semibold text-white mt-1 truncate">{username}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {level !== undefined && (
                    <span className="text-[11px] px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-mono-data">
                      Lv. {level}
                    </span>
                  )}
                  {equippedTitle && (
                    <span className="text-[11px] text-amber-400/90 truncate">{equippedTitle}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={closeMenu}
                className="inline-flex items-center justify-center w-11 h-11 rounded border border-slate-600/40 bg-slate-900/50 text-slate-300 hover:text-white"
                aria-label="Close navigation menu"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => selectTab(tab.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`nav-drawer-item ${isActive ? 'nav-drawer-item-active' : ''}`}
                  >
                    <span className="text-base opacity-90" aria-hidden>
                      {tab.icon}
                    </span>
                    <span className="font-semibold tracking-wide text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}

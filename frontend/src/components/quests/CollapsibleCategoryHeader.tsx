'use client';

interface CollapsibleCategoryHeaderProps {
  title: string;
  icon?: string;
  done: number;
  total: number;
  collapsed: boolean;
  onToggle: () => void;
  trailing?: React.ReactNode;
  /** Extra badge/chip next to title (e.g. workout day type) */
  badge?: React.ReactNode;
}

export default function CollapsibleCategoryHeader({
  title,
  icon,
  done,
  total,
  collapsed,
  onToggle,
  trailing,
  badge,
}: CollapsibleCategoryHeaderProps) {
  const cleared = total > 0 && done === total;

  return (
    <div className="category-sticky relative z-20 flex w-full items-center gap-2 pr-1 min-h-[40px]">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}
        className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left cursor-pointer bg-transparent border-0 p-0 font-inherit text-inherit"
        aria-expanded={!collapsed}
        aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${title}`}
      >
        <span className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {icon != null && <span aria-hidden>{icon}</span>}
          <span>{title}</span>
          {badge}
          <span className="text-slate-400 font-mono-data normal-case tracking-normal">
            ({done}/{total} cleared)
            {cleared ? ' · done' : ''}
          </span>
        </span>
        <span className="text-cyan-400/70 w-4 text-center shrink-0" aria-hidden>
          {collapsed ? '▶' : '▼'}
        </span>
      </button>
      {trailing ? <div className="flex items-center gap-2 shrink-0">{trailing}</div> : null}
    </div>
  );
}

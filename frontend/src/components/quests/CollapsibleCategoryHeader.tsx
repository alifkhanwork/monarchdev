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
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onToggle();
      }}
      className="category-sticky relative z-20 w-full justify-between pr-1 min-h-[40px] text-left cursor-pointer"
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
      <span className="flex items-center gap-2 shrink-0">
        {trailing}
        <span className="text-cyan-400/70 w-4 text-center" aria-hidden>
          {collapsed ? '▶' : '▼'}
        </span>
      </span>
    </button>
  );
}

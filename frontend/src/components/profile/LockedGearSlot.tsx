interface LockedGearSlotProps {
  slotName: string;
  unlockHint: string;
}

export default function LockedGearSlot({ slotName, unlockHint }: LockedGearSlotProps) {
  return (
    <div className="gear-card gear-card-locked border-dashed border-slate-600/40 bg-slate-900/20 opacity-60">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-600/50 bg-slate-800/50 text-slate-500">
          LOCKED
        </span>
        <span className="text-2xl text-slate-600">?</span>
      </div>
      <h4 className="text-sm font-semibold text-slate-500 mb-1">{slotName}</h4>
      <p className="text-[10px] text-slate-600 leading-relaxed">{unlockHint}</p>
      <div className="mt-auto pt-3 border-t border-white/5">
        <div className="h-1 rounded-full bg-slate-800" />
      </div>
    </div>
  );
}

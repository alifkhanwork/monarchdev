interface LockedGearSlotProps {
  slotName: string;
  unlockHint: string;
}

export default function LockedGearSlot({ slotName, unlockHint }: LockedGearSlotProps) {
  return (
    <div className="gear-card gear-card-locked !min-h-[72px] !p-2.5 border-dashed border-slate-600/40 bg-slate-900/20 opacity-55">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-600/50 text-slate-500">
          LOCKED
        </span>
        <h4 className="text-[13px] font-semibold text-slate-500">{slotName}</h4>
        <span className="ml-auto text-slate-600">?</span>
      </div>
      <p className="text-[10px] text-slate-600 mt-1">{unlockHint}</p>
    </div>
  );
}

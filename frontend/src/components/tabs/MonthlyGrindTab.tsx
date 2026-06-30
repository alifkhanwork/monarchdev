'use client';

import { useCallback } from 'react';
import { api } from '@/lib/api';
import GrindPanel from '@/components/grind/GrindPanel';

export default function MonthlyGrindTab() {
  const fetchGrind = useCallback(() => api.getMonthlyGrind(), []);
  const updateProgress = useCallback(
    (id: string, delta: number) => api.updateMonthlyProgress(id, delta),
    []
  );

  return (
    <GrindPanel
      title="Monthly Grind"
      description="Recurring monthly goals — resets on the 1st"
      fetchGrind={fetchGrind}
      updateProgress={updateProgress}
    />
  );
}

'use client';

import { useCallback } from 'react';
import { api } from '@/lib/api';
import GrindPanel from '@/components/grind/GrindPanel';

export default function WeeklyGrindTab() {
  const fetchGrind = useCallback(() => api.getWeeklyGrind(), []);
  const updateProgress = useCallback(
    (id: string, delta: number) => api.updateWeeklyProgress(id, delta),
    []
  );

  return (
    <GrindPanel
      title="Weekly Grind"
      description="Recurring weekly goals — resets every Monday"
      fetchGrind={fetchGrind}
      updateProgress={updateProgress}
    />
  );
}

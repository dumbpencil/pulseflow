import { useMemo } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { getLast7Days } from '../utils/date';

export type DaySummary = {
  date: string;
  totalMinutes: number;
  avgSoreness: number;
  sessionCount: number;
};

export function useWeeklySummary(): DaySummary[] {
  const sessions = useSessionStore((s) => s.sessions);

  return useMemo(() => {
    const days = getLast7Days();
    return days.map((date) => {
      const daySessions = sessions.filter((s) => s.date === date);
      const totalMinutes = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      const avgSoreness =
        daySessions.length > 0
          ? daySessions.reduce((sum, s) => sum + s.sorenessScore, 0) / daySessions.length
          : 0;
      return {
        date,
        totalMinutes,
        avgSoreness,
        sessionCount: daySessions.length,
      };
    });
  }, [sessions]);
}

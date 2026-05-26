import { useMemo } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { RecoverySession } from '../types';
import { toISODate, daysAgoISO } from '../utils/date';

export function useSessionHistory(filter: 'week' | 'month' | 'all' = 'week') {
  const sessions = useSessionStore((s) => s.sessions);

  const filtered = useMemo(() => {
    const now = new Date();
    if (filter === 'week') {
      const start = daysAgoISO(6);
      return sessions.filter((s) => s.date >= start);
    }
    if (filter === 'month') {
      const start = daysAgoISO(29);
      return sessions.filter((s) => s.date >= start);
    }
    return sessions;
  }, [sessions, filter]);

  const avgSoreness = useMemo(() => {
    if (!filtered.length) return 0;
    return filtered.reduce((sum, s) => sum + s.sorenessScore, 0) / filtered.length;
  }, [filtered]);

  return { sessions: filtered, avgSoreness };
}

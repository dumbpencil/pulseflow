import { useMemo } from 'react';
import { useReadinessStore } from '../stores/readinessStore';

export function useSorenessInsight(): string {
  const history = useReadinessStore((s) => s.history);

  return useMemo(() => {
    if (history.length < 2) return 'Log more sessions to see your trend.';

    const recent = history.slice(-3);
    const older = history.slice(0, -3);

    if (!older.length) return 'Keep logging to unlock trend insights.';

    const recentAvg = recent.reduce((s, r) => s + r.sorenessScore, 0) / recent.length;
    const olderAvg = older.reduce((s, r) => s + r.sorenessScore, 0) / older.length;

    const delta = recentAvg - olderAvg;
    const pct = Math.abs(Math.round((delta / olderAvg) * 100));

    if (Math.abs(delta) < 0.5) return 'Your soreness has been consistent this week.';
    if (delta < 0)
      return `Soreness down ${pct}% vs. last week — recovery is working.`;
    return `Soreness up ${pct}% vs. last week — consider an extra rest day.`;
  }, [history]);
}

import { useMemo } from 'react';
import { useReadinessStore } from '../stores/readinessStore';
import { useProfileStore } from '../stores/profileStore';
import { computeRecoveryScore } from '../utils/recoveryScore';

export function useRecoveryScore() {
  const today = useReadinessStore((s) => s.today);
  const device = useProfileStore((s) => s.device);

  const score = useMemo(() => {
    if (!today) {
      return computeRecoveryScore({
        sleepQuality: 3,
        sorenessScore: 5,
        streakDays: 0,
        deviceConnected: device.connected,
      });
    }
    return computeRecoveryScore({
      sleepQuality: today.sleepQuality,
      sorenessScore: today.sorenessScore,
      streakDays: today.streakDay,
      deviceConnected: device.connected,
    });
  }, [today, device.connected]);

  return { score: Math.round(score), today };
}

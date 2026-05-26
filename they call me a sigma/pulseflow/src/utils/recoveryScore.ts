function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function computeRecoveryScore(params: {
  sleepQuality: number;
  sorenessScore: number;
  streakDays: number;
  deviceConnected: boolean;
}): number {
  const { sleepQuality, sorenessScore, streakDays, deviceConnected } = params;

  return clamp(
    (sleepQuality / 5) * 30 +
    ((10 - sorenessScore) / 10) * 40 +
    (Math.min(streakDays, 7) / 7) * 20 +
    (deviceConnected ? 10 : 0),
    0,
    100
  );
}

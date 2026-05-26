import { MMKV } from 'react-native-mmkv';
import { insertSession } from './sessionRepository';
import { upsertReadiness } from './readinessRepository';
import { upsertProfile } from './profileRepository';
import { RecoverySession, DailyReadiness, AthleteProfile } from '../types';
import { computeRecoveryScore } from '../utils/recoveryScore';
import { daysAgoISO } from '../utils/date';

const storage = new MMKV({ id: 'pulseflow-flags' });

const MODALITIES: RecoverySession['modality'][] = ['vibration', 'thermal', 'cold'];

const SORENESS_ARC = [4, 6, 7, 8, 6, 5, 7, 5, 4, 3, 6, 5, 4, 3];
const SESSION_DAYS = [0, 1, 2, 3, 5, 6, 7, 9, 10, 11];

function uuid(index: number): string {
  return `seed-session-${String(index).padStart(3, '0')}`;
}

export function runSeedIfNeeded(): void {
  if (storage.getBoolean('seeded')) return;

  const profile: AthleteProfile = {
    id: 'self',
    name: 'Alex Rivera',
    teamSchool: 'Westbrook Athletics',
    sport: 'Basketball',
    goals: ['Reduce soreness', 'Improve sleep', 'Build streak'],
    planTier: 'free',
  };
  upsertProfile(profile);

  SESSION_DAYS.forEach((daysAgo, i) => {
    const date = daysAgoISO(13 - daysAgo);
    const soreness = SORENESS_ARC[daysAgo] ?? 5;
    const modality = MODALITIES[i % 3];
    const duration = 20 + (i % 3) * 15;
    const delta = +(Math.random() * 10 - 2).toFixed(1);

    const session: RecoverySession = {
      id: uuid(i),
      date,
      modality,
      durationMinutes: duration,
      sorenessScore: soreness,
      recoveryDelta: delta,
      deviceConnected: true,
    };
    insertSession(session);
  });

  for (let d = 13; d >= 0; d--) {
    const date = daysAgoISO(d);
    const sorenessScore = SORENESS_ARC[13 - d] ?? 5;
    const sleepQuality = 2 + Math.floor(Math.random() * 3);
    const streakDay = Math.max(0, 14 - d - 4);
    const recoveryScore = computeRecoveryScore({
      sleepQuality,
      sorenessScore,
      streakDays: streakDay,
      deviceConnected: SESSION_DAYS.includes(13 - d),
    });

    const readiness: DailyReadiness = {
      date,
      recoveryScore: Math.round(recoveryScore),
      sorenessScore,
      sleepQuality,
      streakDay,
    };
    upsertReadiness(readiness);
  }

  storage.set('seeded', true);
}

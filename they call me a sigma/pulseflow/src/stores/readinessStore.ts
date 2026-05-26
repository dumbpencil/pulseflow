import { create } from 'zustand';
import { DailyReadiness } from '../types';
import {
  upsertReadiness,
  getTodayReadiness,
  getReadinessByDateRange,
} from '../db/readinessRepository';
import { computeRecoveryScore } from '../utils/recoveryScore';
import { daysAgoISO, todayISO } from '../utils/date';

type ReadinessStore = {
  today: DailyReadiness | null;
  history: DailyReadiness[];
  loadToday: () => void;
  loadHistory: () => void;
  logReadiness: (params: {
    sorenessScore: number;
    sleepQuality: number;
    deviceConnected: boolean;
  }) => DailyReadiness;
};

export const useReadinessStore = create<ReadinessStore>((set, get) => ({
  today: null,
  history: [],

  loadToday() {
    const result = getTodayReadiness();
    if (result.ok && result.value) {
      set({ today: result.value });
    }
  },

  loadHistory() {
    const start = daysAgoISO(6);
    const end = todayISO();
    const result = getReadinessByDateRange(start, end);
    if (result.ok) set({ history: result.value });
  },

  logReadiness({ sorenessScore, sleepQuality, deviceConnected }) {
    const { today } = get();
    const streakDay = today ? today.streakDay + 1 : 1;
    const recoveryScore = computeRecoveryScore({
      sleepQuality,
      sorenessScore,
      streakDays: streakDay,
      deviceConnected,
    });

    const readiness: DailyReadiness = {
      date: todayISO(),
      recoveryScore: Math.round(recoveryScore),
      sorenessScore,
      sleepQuality,
      streakDay,
    };

    upsertReadiness(readiness);
    set({ today: readiness });
    return readiness;
  },
}));

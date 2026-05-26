import { create } from 'zustand';
import { RecoverySession } from '../types';
import {
  insertSession,
  getWeeklySessions,
  getAllSessions,
  deleteSession,
} from '../db/sessionRepository';

type ActiveSession = {
  modality: RecoverySession['modality'];
  elapsedSeconds: number;
  intensity: number;
  startedAt: string;
};

type SessionStore = {
  sessions: RecoverySession[];
  activeSession: ActiveSession | null;
  loadWeeklySessions: () => void;
  loadAllSessions: () => void;
  startSession: (modality: RecoverySession['modality']) => void;
  updateIntensity: (intensity: number) => void;
  tickElapsed: () => void;
  endSession: (sorenessScore: number, notes?: string) => RecoverySession | null;
  removeSession: (id: string) => void;
};

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  activeSession: null,

  loadWeeklySessions() {
    const result = getWeeklySessions();
    if (result.ok) set({ sessions: result.value });
  },

  loadAllSessions() {
    const result = getAllSessions();
    if (result.ok) set({ sessions: result.value });
  },

  startSession(modality) {
    set({
      activeSession: {
        modality,
        elapsedSeconds: 0,
        intensity: 5,
        startedAt: new Date().toISOString(),
      },
    });
  },

  updateIntensity(intensity) {
    const { activeSession } = get();
    if (!activeSession) return;
    set({ activeSession: { ...activeSession, intensity } });
  },

  tickElapsed() {
    const { activeSession } = get();
    if (!activeSession) return;
    set({
      activeSession: {
        ...activeSession,
        elapsedSeconds: activeSession.elapsedSeconds + 1,
      },
    });
  },

  endSession(sorenessScore, notes) {
    const { activeSession, sessions } = get();
    if (!activeSession) return null;

    const durationMinutes = Math.max(
      1,
      Math.round(activeSession.elapsedSeconds / 60)
    );
    const recoveryDelta = +((10 - sorenessScore) * 0.8 - 3).toFixed(1);

    const session: RecoverySession = {
      id: `session-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      modality: activeSession.modality,
      durationMinutes,
      sorenessScore,
      recoveryDelta,
      deviceConnected: false,
      notes,
    };

    insertSession(session);
    set({ sessions: [session, ...sessions], activeSession: null });
    return session;
  },

  removeSession(id) {
    deleteSession(id);
    set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) }));
  },
}));

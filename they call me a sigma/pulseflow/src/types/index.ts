export type RecoverySession = {
  id: string;
  date: string;
  modality: 'vibration' | 'thermal' | 'cold';
  durationMinutes: number;
  sorenessScore: number;
  recoveryDelta: number;
  deviceConnected: boolean;
  notes?: string;
};

export type DailyReadiness = {
  date: string;
  recoveryScore: number;
  sorenessScore: number;
  sleepQuality: number;
  streakDay: number;
};

export type AthleteProfile = {
  id: string;
  name: string;
  teamSchool: string;
  sport: string;
  goals: string[];
  planTier: 'free' | 'premium';
};

export type DeviceState = {
  connected: boolean;
  batteryPercent: number | null;
  firmwareVersion: string | null;
  lastSyncTimestamp: string | null;
  rssi: number | null;
  simulated: boolean;
};

export type CoachNote = {
  athleteId: string;
  date: string;
  note: string;
};

export type MockAthlete = {
  id: string;
  name: string;
  sport: string;
  recoveryScore: number;
  sorenessScore: number;
  streakDay: number;
  sevenDaySoreness: number[];
};

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type SignalTier = 'excellent' | 'good' | 'weak' | 'very_weak';

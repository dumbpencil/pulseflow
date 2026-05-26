import { getDb } from './schema';
import { RecoverySession, Result } from '../types';

function rowToSession(row: any): RecoverySession {
  return {
    id: row.id,
    date: row.date,
    modality: row.modality,
    durationMinutes: row.duration_minutes,
    sorenessScore: row.soreness_score,
    recoveryDelta: row.recovery_delta,
    deviceConnected: row.device_connected === 1,
    notes: row.notes ?? undefined,
  };
}

export function insertSession(session: RecoverySession): Result<void> {
  try {
    const db = getDb();
    db.runSync(
      `INSERT OR REPLACE INTO recovery_sessions
         (id, date, modality, duration_minutes, soreness_score, recovery_delta, device_connected, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      session.id,
      session.date,
      session.modality,
      session.durationMinutes,
      session.sorenessScore,
      session.recoveryDelta,
      session.deviceConnected ? 1 : 0,
      session.notes ?? null
    );
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

export function getSessionsByDateRange(
  startDate: string,
  endDate: string
): Result<RecoverySession[]> {
  try {
    const db = getDb();
    const rows = db.getAllSync(
      `SELECT * FROM recovery_sessions WHERE date >= ? AND date <= ? ORDER BY date DESC`,
      startDate,
      endDate
    );
    return { ok: true, value: rows.map(rowToSession) };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

export function getWeeklySessions(): Result<RecoverySession[]> {
  try {
    const db = getDb();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const rows = db.getAllSync(
      `SELECT * FROM recovery_sessions WHERE date >= ? AND date <= ? ORDER BY date ASC`,
      startDate,
      today
    );
    return { ok: true, value: rows.map(rowToSession) };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

export function getAllSessions(): Result<RecoverySession[]> {
  try {
    const db = getDb();
    const rows = db.getAllSync(
      `SELECT * FROM recovery_sessions ORDER BY date DESC`
    );
    return { ok: true, value: rows.map(rowToSession) };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

export function deleteSession(id: string): Result<void> {
  try {
    const db = getDb();
    db.runSync(`DELETE FROM recovery_sessions WHERE id = ?`, id);
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

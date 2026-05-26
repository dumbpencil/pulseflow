import { getDb } from './schema';
import { DailyReadiness, Result } from '../types';

function rowToReadiness(row: any): DailyReadiness {
  return {
    date: row.date,
    recoveryScore: row.recovery_score,
    sorenessScore: row.soreness_score,
    sleepQuality: row.sleep_quality,
    streakDay: row.streak_day,
  };
}

export function upsertReadiness(readiness: DailyReadiness): Result<void> {
  try {
    const db = getDb();
    db.runSync(
      `INSERT OR REPLACE INTO daily_readiness
         (date, recovery_score, soreness_score, sleep_quality, streak_day)
       VALUES (?, ?, ?, ?, ?)`,
      readiness.date,
      readiness.recoveryScore,
      readiness.sorenessScore,
      readiness.sleepQuality,
      readiness.streakDay
    );
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

export function getReadinessByDateRange(
  startDate: string,
  endDate: string
): Result<DailyReadiness[]> {
  try {
    const db = getDb();
    const rows = db.getAllSync(
      `SELECT * FROM daily_readiness WHERE date >= ? AND date <= ? ORDER BY date ASC`,
      startDate,
      endDate
    );
    return { ok: true, value: rows.map(rowToReadiness) };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

export function getTodayReadiness(): Result<DailyReadiness | null> {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const row = db.getFirstSync(
      `SELECT * FROM daily_readiness WHERE date = ?`,
      today
    );
    return { ok: true, value: row ? rowToReadiness(row) : null };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

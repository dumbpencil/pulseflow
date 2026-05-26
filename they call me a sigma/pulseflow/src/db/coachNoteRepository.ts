import { getDb } from './schema';
import { CoachNote, Result } from '../types';

export function upsertCoachNote(note: CoachNote): Result<void> {
  try {
    const db = getDb();
    db.runSync(
      `INSERT OR REPLACE INTO coach_notes (athlete_id, date, note) VALUES (?, ?, ?)`,
      note.athleteId,
      note.date,
      note.note
    );
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

export function getCoachNote(
  athleteId: string,
  date: string
): Result<CoachNote | null> {
  try {
    const db = getDb();
    const row = db.getFirstSync(
      `SELECT * FROM coach_notes WHERE athlete_id = ? AND date = ?`,
      athleteId,
      date
    );
    if (!row) return { ok: true, value: null };
    const r = row as any;
    return {
      ok: true,
      value: { athleteId: r.athlete_id, date: r.date, note: r.note },
    };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

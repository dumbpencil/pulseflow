import { getDb } from './schema';
import { AthleteProfile, Result } from '../types';

function rowToProfile(row: any): AthleteProfile {
  return {
    id: row.id,
    name: row.name,
    teamSchool: row.team_school,
    sport: row.sport,
    goals: JSON.parse(row.goals),
    planTier: row.plan_tier,
  };
}

export function getProfile(): Result<AthleteProfile | null> {
  try {
    const db = getDb();
    const row = db.getFirstSync(`SELECT * FROM athlete_profile LIMIT 1`);
    return { ok: true, value: row ? rowToProfile(row) : null };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

export function upsertProfile(profile: AthleteProfile): Result<void> {
  try {
    const db = getDb();
    db.runSync(
      `INSERT OR REPLACE INTO athlete_profile
         (id, name, team_school, sport, goals, plan_tier)
       VALUES (?, ?, ?, ?, ?, ?)`,
      profile.id,
      profile.name,
      profile.teamSchool,
      profile.sport,
      JSON.stringify(profile.goals),
      profile.planTier
    );
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

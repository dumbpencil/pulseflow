import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('pulseflow.db');
  }
  return db;
}

export function initSchema(): void {
  const db = getDb();

  db.execSync(`
    CREATE TABLE IF NOT EXISTS recovery_sessions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      modality TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      soreness_score INTEGER NOT NULL,
      recovery_delta REAL NOT NULL,
      device_connected INTEGER NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_readiness (
      date TEXT PRIMARY KEY,
      recovery_score REAL NOT NULL,
      soreness_score INTEGER NOT NULL,
      sleep_quality INTEGER NOT NULL,
      streak_day INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS athlete_profile (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      team_school TEXT NOT NULL,
      sport TEXT NOT NULL,
      goals TEXT NOT NULL,
      plan_tier TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coach_notes (
      athlete_id TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT NOT NULL,
      PRIMARY KEY (athlete_id, date)
    );
  `);
}

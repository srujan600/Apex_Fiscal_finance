import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

let dbInstance: DatabaseSync | null = null;

/**
 * Initializes and returns the SQLite database instance with WAL mode and foreign keys enabled.
 */
export function getDb(customPath?: string): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = customPath || env.DATABASE_PATH;
  
  if (dbPath !== ':memory:') {
    const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    dbInstance = new DatabaseSync(resolvedPath);
  } else {
    dbInstance = new DatabaseSync(':memory:');
  }

  // Enforce WAL mode for maximum concurrent read performance and ACID guarantees
  dbInstance.exec('PRAGMA journal_mode = WAL;');
  dbInstance.exec('PRAGMA foreign_keys = ON;');
  dbInstance.exec('PRAGMA busy_timeout = 5000;');

  return dbInstance;
}

/**
 * Closes the database instance (used during graceful shutdown or tests).
 */
export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Executes a callback inside an atomic transaction (BEGIN IMMEDIATE / COMMIT / ROLLBACK)
 * to prevent race conditions during concurrent financial operations.
 */
export function runTransaction<T>(callback: (db: DatabaseSync) => T, customDb?: DatabaseSync): T {
  const db = customDb || getDb();
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = callback(db);
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}

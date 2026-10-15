import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// T012 — Conexión a ~/.task-cli/tasks.db (research.md R2, R9).
// El SQL es el de data-model.md sin alterar.
export const CREATE_TASKS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  description TEXT,
  priority    TEXT    NOT NULL DEFAULT 'medium'
              CHECK (priority IN ('high','medium','low')),
  status      TEXT    NOT NULL DEFAULT 'todo'
              CHECK (status IN ('todo','in-progress','done')),
  created_at  TEXT    NOT NULL
);`;

// Ruta canónica: os.homedir() honra HOME (POSIX) y USERPROFILE (Windows),
// por lo que las pruebas de integración aíslan la BD con variables de entorno.
export function defaultDbPath(): string {
  return path.join(os.homedir(), '.task-cli', 'tasks.db');
}

export function openDatabase(
  dbPath: string = defaultDbPath(),
): Database.Database {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(CREATE_TASKS_TABLE_SQL);
  return db;
}

import type { Database } from 'better-sqlite3';
import type { Priority, Status } from '../utils/validation';

// T014 — Persistencia de tareas: SQL plano sin ORM (principios II y VIII).
export interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: Priority;
  status: Status;
  created_at: string;
}

export interface NewTask {
  title: string;
  description?: string | null;
  priority?: Priority;
}

export interface TaskFilters {
  status?: Status;
  priority?: Priority;
}

export interface UpdateFields {
  title?: string;
  description?: string | null;
  priority?: Priority;
}

export function insertTask(db: Database, input: NewTask): Task {
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO tasks (title, description, priority, status, created_at)
       VALUES (?, ?, ?, 'todo', ?)`,
    )
    .run(
      input.title,
      input.description ?? null,
      input.priority ?? 'medium',
      createdAt,
    );
  const task = getTaskById(db, Number(result.lastInsertRowid));
  if (!task) {
    throw new Error('la tarea recién insertada no se pudo leer');
  }
  return task;
}

// V6 — orden `created_at DESC, id DESC`; filtros opcionales en AND (V5).
export function listTasks(db: Database, filters: TaskFilters = {}): Task[] {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filters.status !== undefined) {
    clauses.push('status = ?');
    params.push(filters.status);
  }
  if (filters.priority !== undefined) {
    clauses.push('priority = ?');
    params.push(filters.priority);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `SELECT * FROM tasks ${where} ORDER BY created_at DESC, id DESC`;
  return db.prepare(sql).all(...params) as unknown as Task[];
}

export function getTaskById(db: Database, id: number): Task | undefined {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as
    | Task
    | undefined;
}

// V7 — actualiza SOLO los campos indicados; el status nunca se modifica aquí.
export function updateTask(db: Database, id: number, fields: UpdateFields): number {
  const assignments: string[] = [];
  const params: (string | number | null)[] = [];

  if (fields.title !== undefined) {
    assignments.push('title = ?');
    params.push(fields.title);
  }
  if (fields.description !== undefined) {
    assignments.push('description = ?');
    params.push(fields.description);
  }
  if (fields.priority !== undefined) {
    assignments.push('priority = ?');
    params.push(fields.priority);
  }
  if (assignments.length === 0) return 0;

  params.push(id);
  const result = db
    .prepare(`UPDATE tasks SET ${assignments.join(', ')} WHERE id = ?`)
    .run(...params);
  return result.changes;
}

export function deleteTask(db: Database, id: number): boolean {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return result.changes > 0;
}

export function setStatus(db: Database, id: number, status: Status): number {
  const result = db
    .prepare('UPDATE tasks SET status = ? WHERE id = ?')
    .run(status, id);
  return result.changes;
}

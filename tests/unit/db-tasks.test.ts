import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CREATE_TASKS_TABLE_SQL } from '../../src/db/connection';
import {
  deleteTask,
  getTaskById,
  insertTask,
  listTasks,
  setStatus,
  updateTask,
} from '../../src/db/tasks';

// T013 — Persistencia: CRUD, filtros combinados AND y orden
// `created_at DESC, id DESC` (V5/V6 de data-model.md) sobre BD :memory:.
let db: Database.Database;

beforeEach(() => {
  db = new Database(':memory:');
  db.exec(CREATE_TASKS_TABLE_SQL);
});

afterEach(() => {
  db.close();
});

function fijarFecha(id: number, fecha: string): void {
  db.prepare('UPDATE tasks SET created_at = ? WHERE id = ?').run(fecha, id);
}

describe('insertTask', () => {
  it('crea una tarea con ID 1, estado todo y prioridad medium por defecto', () => {
    const tarea = insertTask(db, { title: 'Comprar leche' });
    expect(tarea.id).toBe(1);
    expect(tarea.title).toBe('Comprar leche');
    expect(tarea.description).toBeNull();
    expect(tarea.priority).toBe('medium');
    expect(tarea.status).toBe('todo');
    expect(tarea.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('asigna IDs autoincrementales que nunca se reutilizan', () => {
    const primera = insertTask(db, { title: 'Primera' });
    const segunda = insertTask(db, { title: 'Segunda', priority: 'high' });
    expect(primera.id).toBe(1);
    expect(segunda.id).toBe(2);
    expect(segunda.priority).toBe('high');
    deleteTask(db, 2);
    const tercera = insertTask(db, { title: 'Tercera' });
    expect(tercera.id).toBe(3);
  });

  it('persiste la descripción opcional', () => {
    const tarea = insertTask(db, {
      title: 'Pagar factura',
      description: 'Antes del viernes',
    });
    expect(tarea.description).toBe('Antes del viernes');
  });
});

describe('getTaskById', () => {
  it('devuelve la tarea existente', () => {
    insertTask(db, { title: 'Comprar leche' });
    const tarea = getTaskById(db, 1);
    expect(tarea?.title).toBe('Comprar leche');
  });

  it('devuelve undefined para un ID inexistente', () => {
    expect(getTaskById(db, 99)).toBeUndefined();
  });
});

describe('listTasks', () => {
  it('ordena por created_at DESC con desempate id DESC (V6)', () => {
    const a = insertTask(db, { title: 'Antigua' });
    const b = insertTask(db, { title: 'Reciente' });
    const c = insertTask(db, { title: 'Media' });
    fijarFecha(a.id, '2026-01-01T00:00:00.000Z');
    fijarFecha(b.id, '2026-03-01T00:00:00.000Z');
    fijarFecha(c.id, '2026-02-01T00:00:00.000Z');
    expect(listTasks(db).map((t) => t.title)).toEqual([
      'Reciente',
      'Media',
      'Antigua',
    ]);
  });

  it('desempata por id DESC cuando created_at coincide', () => {
    insertTask(db, { title: 'Primera' });
    insertTask(db, { title: 'Segunda' });
    insertTask(db, { title: 'Tercera' });
    db.prepare('UPDATE tasks SET created_at = ?').run('2026-01-01T00:00:00.000Z');
    expect(listTasks(db).map((t) => t.id)).toEqual([3, 2, 1]);
  });

  it('filtra por status', () => {
    const a = insertTask(db, { title: 'Una' });
    insertTask(db, { title: 'Otra' });
    setStatus(db, a.id, 'done');
    const listado = listTasks(db, { status: 'done' });
    expect(listado).toHaveLength(1);
    expect(listado[0].title).toBe('Una');
  });

  it('filtra por priority', () => {
    insertTask(db, { title: 'Alta', priority: 'high' });
    insertTask(db, { title: 'Baja', priority: 'low' });
    expect(listTasks(db, { priority: 'high' }).map((t) => t.title)).toEqual([
      'Alta',
    ]);
  });

  it('combina status y priority con intersección AND (V5)', () => {
    const altaDone = insertTask(db, { title: 'AltaDone', priority: 'high' });
    insertTask(db, { title: 'AltaTodo', priority: 'high' });
    const mediaDone = insertTask(db, { title: 'MediaDone', priority: 'medium' });
    setStatus(db, altaDone.id, 'done');
    setStatus(db, mediaDone.id, 'done');

    const resultado = listTasks(db, { status: 'done', priority: 'high' });
    expect(resultado.map((t) => t.title)).toEqual(['AltaDone']);

    expect(listTasks(db, { status: 'todo', priority: 'high' })).toHaveLength(1);
    expect(
      listTasks(db, { status: 'todo', priority: 'low' }),
    ).toHaveLength(0);
  });

  it('devuelve la lista completa sin filtros, incluidas las done', () => {
    const a = insertTask(db, { title: 'Una' });
    insertTask(db, { title: 'Otra' });
    setStatus(db, a.id, 'done');
    expect(listTasks(db)).toHaveLength(2);
  });
});

describe('updateTask', () => {
  it('actualiza solo los campos indicados y nunca el status (V7)', () => {
    const tarea = insertTask(db, { title: 'Original', priority: 'medium' });
    updateTask(db, tarea.id, { title: 'Actualizada', priority: 'low' });
    const trasUpdate = getTaskById(db, tarea.id);
    expect(trasUpdate?.title).toBe('Actualizada');
    expect(trasUpdate?.priority).toBe('low');
    expect(trasUpdate?.status).toBe('todo');
    expect(trasUpdate?.created_at).toBe(tarea.created_at);
  });

  it('actualiza la descripción', () => {
    const tarea = insertTask(db, { title: 'Una' });
    updateTask(db, tarea.id, { description: 'nueva' });
    expect(getTaskById(db, tarea.id)?.description).toBe('nueva');
  });

  it('devuelve 0 cambios para un ID inexistente', () => {
    expect(updateTask(db, 99, { title: 'x' })).toBe(0);
  });
});

describe('deleteTask', () => {
  it('elimina la tarea existente', () => {
    insertTask(db, { title: 'Bórrame' });
    expect(deleteTask(db, 1)).toBe(true);
    expect(getTaskById(db, 1)).toBeUndefined();
  });

  it('devuelve false para un ID inexistente', () => {
    expect(deleteTask(db, 99)).toBe(false);
  });
});

describe('setStatus', () => {
  it('cambia el estado de la tarea', () => {
    const tarea = insertTask(db, { title: 'Una' });
    expect(setStatus(db, tarea.id, 'in-progress')).toBe(1);
    expect(getTaskById(db, tarea.id)?.status).toBe('in-progress');
  });

  it('devuelve 0 para un ID inexistente', () => {
    expect(setStatus(db, 99, 'done')).toBe(0);
  });
});

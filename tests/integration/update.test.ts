import Database from 'better-sqlite3';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  cleanupHomes,
  createHome,
  expectNoStack,
  runCli,
} from './helpers';

// T028 — US4: escenarios §6 de quickstart.md (FR-008, V7).
afterAll(cleanupHomes);

function leerTarea(home: string, id: number): Record<string, unknown> {
  const db = new Database(path.join(home, '.task-cli', 'tasks.db'));
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;
  db.close();
  if (!row) throw new Error(`la tarea ${id} no existe`);
  return row;
}

function fijarEstado(home: string, id: number, estado: string): void {
  const db = new Database(path.join(home, '.task-cli', 'tasks.db'));
  db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(estado, id);
  db.close();
}

function crearTarea(home: string, titulo: string): void {
  const result = runCli(['create', titulo], { home });
  expect(result.status).toBe(0);
}

describe('update — US4', () => {
  it('actualiza título y prioridad (exit 0)', () => {
    const home = createHome();
    crearTarea(home, 'Comprar leche');

    const result = runCli(
      ['update', '1', '--title', 'Comprar leche y pan', '--priority', 'low'],
      { home },
    );

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('Tarea 1 actualizada.');

    const tarea = leerTarea(home, 1);
    expect(tarea.title).toBe('Comprar leche y pan');
    expect(tarea.priority).toBe('low');
    expectNoStack(result);
  });

  it('actualiza solo la descripción (exit 0)', () => {
    const home = createHome();
    crearTarea(home, 'Comprar leche');

    const result = runCli(['update', '1', '--description', 'nueva'], { home });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('Tarea 1 actualizada.');
    expect(leerTarea(home, 1).description).toBe('nueva');
  });

  it('sin ningún flag de campo → exit 1 con el mensaje de V7', () => {
    const home = createHome();
    crearTarea(home, 'Comprar leche');

    const result = runCli(['update', '1'], { home });
    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe(
      'Error: indica al menos un campo a actualizar: --title, --description o --priority.',
    );
    expectNoStack(result);
  });

  it('ID inexistente → exit 1', () => {
    const home = createHome();
    const result = runCli(['update', '99', '--title', 'x'], { home });

    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe('Error: no existe la tarea con ID 99.');
    expectNoStack(result);
  });

  it('título vacío → exit 1', () => {
    const home = createHome();
    crearTarea(home, 'Comprar leche');

    const result = runCli(['update', '1', '--title', '   '], { home });
    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe('Error: el título no puede estar vacío.');
  });

  it('prioridad inválida → exit 1', () => {
    const home = createHome();
    crearTarea(home, 'Comprar leche');

    const result = runCli(['update', '1', '--priority', 'urgent'], { home });
    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe(
      'Error: prioridad inválida "urgent". Valores válidos: high, medium, low.',
    );
  });

  it('el status NO cambia por update (V7)', () => {
    const home = createHome();
    crearTarea(home, 'Comprar leche');
    fijarEstado(home, 1, 'done');

    const result = runCli(
      ['update', '1', '--title', 'Comprar pan', '--priority', 'high'],
      { home },
    );
    expect(result.status).toBe(0);

    const tarea = leerTarea(home, 1);
    expect(tarea.status).toBe('done');
    expect(tarea.title).toBe('Comprar pan');
    // Tampoco modifica created_at.
    expect(tarea.created_at).toBe(leerTarea(home, 1).created_at);
  });
});

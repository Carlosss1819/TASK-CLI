import Database from 'better-sqlite3';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  cleanupHomes,
  createHome,
  expectNoStack,
  runCli,
} from './helpers';

// T032 — US5: escenarios §7 de quickstart.md (FR-009, clarificación Q5).
afterAll(cleanupHomes);

function existeTarea(home: string, id: number): boolean {
  const db = new Database(path.join(home, '.task-cli', 'tasks.db'));
  const row = db.prepare('SELECT id FROM tasks WHERE id = ?').get(id);
  db.close();
  return row !== undefined;
}

function crearTarea(home: string, titulo: string): number {
  const result = runCli(['create', titulo], { home });
  expect(result.status).toBe(0);
  const match = /Tarea (\d+) creada/.exec(result.stdout);
  if (!match) throw new Error(`no se pudo crear la tarea: ${result.stdout}`);
  return Number(match[1]);
}

describe('delete — US5', () => {
  it('--force elimina directamente con exit 0', () => {
    const home = createHome();
    const id = crearTarea(home, 'Comprar leche');
    crearTarea(home, 'Pagar factura');
    crearTarea(home, 'Sacar basura');

    const result = runCli(['delete', String(id), '--force'], { home });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(`Tarea ${id} eliminada.`);
    expect(existeTarea(home, id)).toBe(false);
    expectNoStack(result);
  });

  it('ID inexistente con --force → exit 1', () => {
    const home = createHome();
    const result = runCli(['delete', '99', '--force'], { home });

    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe('Error: no existe la tarea con ID 99.');
    expectNoStack(result);
  });

  it('ID no numérico → exit 1', () => {
    const home = createHome();
    const result = runCli(['delete', 'abc', '--force'], { home });

    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe(
      'Error: el ID debe ser un número entero positivo. Recibido: "abc".',
    );
    expectNoStack(result);
  });

  it('stdin no TTY sin --force → exit 1 sugiriendo --force, tarea intacta', () => {
    const home = createHome();
    const id = crearTarea(home, 'Comprar leche');

    const result = runCli(['delete', String(id)], { home, input: 'n\n' });
    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe(
      'Error: la entrada no es interactiva; usa --force para eliminar sin confirmación.',
    );
    expect(existeTarea(home, id)).toBe(true);
    expectNoStack(result);
  });

  it('stdin vacío sin --force → exit 1, tarea intacta', () => {
    const home = createHome();
    const id = crearTarea(home, 'Pagar factura');

    const result = runCli(['delete', String(id)], { home, input: '' });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('--force');
    expect(existeTarea(home, id)).toBe(true);
  });

  it('varias tareas: eliminar una no afecta a las demás', () => {
    const home = createHome();
    const id = crearTarea(home, 'Una');
    const id2 = crearTarea(home, 'Dos');

    const result = runCli(['delete', String(id), '--force'], { home });
    expect(result.status).toBe(0);
    expect(existeTarea(home, id)).toBe(false);
    expect(existeTarea(home, id2)).toBe(true);
  });
});

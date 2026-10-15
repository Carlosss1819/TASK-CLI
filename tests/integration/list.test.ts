import Database from 'better-sqlite3';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  cleanupHomes,
  createHome,
  expectNoStack,
  runCli,
} from './helpers';

// T019 — US2: escenarios §2–§3 de quickstart.md (FR-003…FR-005, V5, V6).
afterAll(cleanupHomes);

const stripAnsi = (text: string): string => text.replace(/\x1b\[[0-9;]*m/g, '');

// Prepara estados escribiendo directo en la BD: la US2 no depende de la US3.
function fijarEstado(home: string, id: number, estado: string): void {
  const db = new Database(path.join(home, '.task-cli', 'tasks.db'));
  db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(estado, id);
  db.close();
}

function crearTareas(home: string): void {
  runCli(['create', 'Comprar leche'], { home });
  runCli(
    ['create', 'Pagar factura', '--priority', 'high', '--description', 'Antes del viernes'],
    { home },
  );
  runCli(['create', 'Sacar la basura'], { home });
  fijarEstado(home, 2, 'in-progress');
  fijarEstado(home, 3, 'done');
}

describe('list — US2', () => {
  it('muestra una tabla en español con cabeceras y orden más reciente primero', () => {
    const home = createHome();
    crearTareas(home);

    const result = runCli(['list'], { home });
    expect(result.status).toBe(0);

    const salida = stripAnsi(result.stdout);
    for (const cabecera of ['ID', 'Título', 'Estado', 'Prioridad', 'Creada']) {
      expect(salida).toContain(cabecera);
    }

    // Todas las tareas, incluidas las done (FR-003) y ordenadas V6.
    expect(salida).toContain('Comprar leche');
    expect(salida).toContain('Pagar factura');
    expect(salida).toContain('Sacar la basura');
    expect(salida).toContain('2026-'); // fecha de creación formateada
    const posReciente = salida.indexOf('Sacar la basura');
    const posAntigua = salida.indexOf('Comprar leche');
    expect(posReciente).toBeGreaterThan(-1);
    expect(posAntigua).toBeGreaterThan(posReciente);
    expectNoStack(result);
  });

  it('filtra por --status', () => {
    const home = createHome();
    crearTareas(home);

    const result = runCli(['list', '--status', 'done'], { home });
    expect(result.status).toBe(0);
    const salida = stripAnsi(result.stdout);
    expect(salida).toContain('Sacar la basura');
    expect(salida).not.toContain('Comprar leche');
    expect(salida).not.toContain('Pagar factura');
  });

  it('filtra por --priority', () => {
    const home = createHome();
    crearTareas(home);

    const result = runCli(['list', '--priority', 'high'], { home });
    expect(result.status).toBe(0);
    const salida = stripAnsi(result.stdout);
    expect(salida).toContain('Pagar factura');
    expect(salida).not.toContain('Comprar leche');
  });

  it('combina --status y --priority con intersección AND (V5)', () => {
    const home = createHome();
    crearTareas(home);

    const result = runCli(
      ['list', '--status', 'done', '--priority', 'high'],
      { home },
    );
    expect(result.status).toBe(0);
    // Ninguna tarea es a la vez done y high en este escenario.
    expect(stripAnsi(result.stdout).trim()).toBe(
      'No hay tareas que coincidan con el filtro.',
    );

    const result2 = runCli(
      ['list', '--status', 'in-progress', '--priority', 'high'],
      { home },
    );
    expect(result2.status).toBe(0);
    expect(stripAnsi(result2.stdout)).toContain('Pagar factura');
    expect(stripAnsi(result2.stdout)).not.toContain('Sacar la basura');
  });

  it('base vacía sin filtros → "No hay tareas." sin tabla (exit 0)', () => {
    const home = createHome();
    const result = runCli(['list'], { home });

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('No hay tareas.');
    expect(result.stdout).not.toContain('┌');
    expectNoStack(result);
  });

  it('filtros sin coincidencias → mensaje específico sin tabla (exit 0)', () => {
    const home = createHome();
    runCli(['create', 'Única'], { home });

    const result = runCli(['list', '--status', 'done'], { home });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(
      'No hay tareas que coincidan con el filtro.',
    );
    expect(result.stdout).not.toContain('┌');
  });

  it('rechaza --status inválido con los valores válidos (exit 1)', () => {
    const home = createHome();
    const result = runCli(['list', '--status', 'bogus'], { home });

    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe(
      'Error: valor inválido para --status "bogus". Valores válidos: todo, in-progress, done.',
    );
    expectNoStack(result);
  });

  it('rechaza --priority inválida con los valores válidos (exit 1)', () => {
    const home = createHome();
    const result = runCli(['list', '--priority', 'urgent'], { home });

    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe(
      'Error: valor inválido para --priority "urgent". Valores válidos: high, medium, low.',
    );
    expectNoStack(result);
  });
});

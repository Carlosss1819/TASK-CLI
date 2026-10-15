import fs from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  cleanupHomes,
  createHome,
  expectNoStack,
  runCli,
} from './helpers';

// T016 — US1: escenarios §1 de quickstart.md (FR-001, FR-002).
afterAll(cleanupHomes);

describe('create — US1', () => {
  it('crea una tarea con título y valores por defecto (exit 0)', () => {
    const home = createHome();
    const result = runCli(['create', 'Comprar leche'], { home });

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(
      'Tarea 1 creada: "Comprar leche" (prioridad: medium, estado: todo)',
    );
    expect(result.stderr).toBe('');
    expectNoStack(result);
  });

  it('acepta prioridad y descripción opcionales', () => {
    const home = createHome();
    const result = runCli(
      [
        'create',
        'Pagar factura',
        '--priority',
        'high',
        '--description',
        'Antes del viernes',
      ],
      { home },
    );

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(
      'Tarea 1 creada: "Pagar factura" (prioridad: high, estado: todo)',
    );
    expectNoStack(result);
  });

  it('asigna IDs autoincrementales y permite títulos repetidos', () => {
    const home = createHome();
    const primera = runCli(['create', 'Comprar leche'], { home });
    const segunda = runCli(['create', 'Comprar leche'], { home });

    expect(primera.status).toBe(0);
    expect(primera.stdout).toContain('Tarea 1 creada');
    expect(segunda.status).toBe(0);
    expect(segunda.stdout).toContain('Tarea 2 creada');
  });

  it('rechaza un título vacío (exit 1)', () => {
    const home = createHome();
    const result = runCli(['create', ''], { home });

    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe('Error: el título no puede estar vacío.');
    expect(result.stdout).toBe('');
    expectNoStack(result);
  });

  it('rechaza la falta del argumento obligatorio <título> (exit 1)', () => {
    const home = createHome();
    const result = runCli(['create'], { home });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'Error: falta el argumento obligatorio <título>.',
    );
    expect(result.stderr).toContain(
      'Uso: task-cli create <título> [--priority high|medium|low] [--description <texto>]',
    );
    expectNoStack(result);
  });

  it('rechaza una prioridad inválida citando los valores válidos (exit 1)', () => {
    const home = createHome();
    const result = runCli(['create', 'x', '--priority', 'urgent'], { home });

    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe(
      'Error: prioridad inválida "urgent". Valores válidos: high, medium, low.',
    );
    expectNoStack(result);
  });

  it('persiste la tarea en ~/.task-cli/tasks.db (FR-010)', () => {
    const home = createHome();
    runCli(['create', 'Persistir'], { home });

    const dbPath = path.join(home, '.task-cli', 'tasks.db');
    expect(fs.existsSync(dbPath)).toBe(true);
  });
});

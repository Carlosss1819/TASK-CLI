import { afterAll, describe, expect, it } from 'vitest';
import {
  cleanupHomes,
  createHome,
  expectNoStack,
  runCli,
} from './helpers';

// T023 — US3: escenarios §4 de quickstart.md (FR-006, FR-007, SC-002).
afterAll(cleanupHomes);

function crearTarea(home: string): void {
  const result = runCli(['create', 'Comprar leche'], { home });
  expect(result.status).toBe(0);
}

describe('status — US3', () => {
  it('recorre las 4 transiciones válidas con exit 0', () => {
    const home = createHome();
    crearTarea(home);

    const a1 = runCli(['status', '1', 'in-progress'], { home });
    expect(a1.status).toBe(0);
    expect(a1.stdout.trim()).toBe('Tarea 1: todo → in-progress');

    const a2 = runCli(['status', '1', 'done'], { home });
    expect(a2.status).toBe(0);
    expect(a2.stdout.trim()).toBe('Tarea 1: in-progress → done');

    const a3 = runCli(['status', '1', 'todo'], { home });
    expect(a3.status).toBe(0);
    expect(a3.stdout.trim()).toBe('Tarea 1: done → todo');

    // in-progress → todo es la 4ª válida (creando otra tarea para no
    // repetir el camino anterior de la misma fila).
    const b = runCli(['create', 'Otra'], { home });
    expect(b.status).toBe(0);
    const b1 = runCli(['status', '2', 'in-progress'], { home });
    expect(b1.status).toBe(0);
    const b2 = runCli(['status', '2', 'todo'], { home });
    expect(b2.status).toBe(0);
    expect(b2.stdout.trim()).toBe('Tarea 2: in-progress → todo');
    expectNoStack(a1);
  });

  it('rechaza todo → done con las transiciones válidas desde el estado actual (exit 1)', () => {
    const home = createHome();
    crearTarea(home);

    const result = runCli(['status', '1', 'done'], { home });
    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe(
      'Error: no se puede cambiar la tarea 1 de "todo" a "done". Transiciones válidas desde "todo": in-progress.',
    );
    expectNoStack(result);
  });

  it('rechaza la auto-transición X → X (exit 1)', () => {
    const home = createHome();
    crearTarea(home);

    const result = runCli(['status', '1', 'todo'], { home });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'no se puede cambiar la tarea 1 de "todo" a "todo"',
    );
    expectNoStack(result);
  });

  it('rechaza un ID inexistente (exit 1)', () => {
    const home = createHome();
    const result = runCli(['status', '99', 'in-progress'], { home });

    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe(
      'Error: no existe la tarea con ID 99.',
    );
    expectNoStack(result);
  });

  it('rechaza un estado desconocido citando los válidos (exit 1)', () => {
    const home = createHome();
    crearTarea(home);

    const result = runCli(['status', '1', 'flying'], { home });
    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe(
      'Error: estado inválido "flying". Valores válidos: todo, in-progress, done.',
    );
    expectNoStack(result);
  });

  it('rechaza un ID no numérico (exit 1)', () => {
    const home = createHome();
    const result = runCli(['status', 'abc', 'done'], { home });

    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe(
      'Error: el ID debe ser un número entero positivo. Recibido: "abc".',
    );
    expectNoStack(result);
  });
});

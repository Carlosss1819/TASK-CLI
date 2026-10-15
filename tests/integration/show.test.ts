import { afterAll, describe, expect, it } from 'vitest';
import {
  cleanupHomes,
  createHome,
  expectNoStack,
  runCli,
} from './helpers';

// T036 — US6: escenarios §5 de quickstart.md (FR-014, clarificación Q2).
afterAll(cleanupHomes);

describe('show — US6', () => {
  it('muestra todas las filas de la tarea incluida la descripción', () => {
    const home = createHome();
    runCli(
      ['create', 'Pagar factura', '--priority', 'high', '--description', 'Antes del viernes'],
      { home },
    );

    const result = runCli(['show', '1'], { home });
    expect(result.status).toBe(0);

    const lineas = result.stdout;
    expect(lineas).toContain('ID:');
    expect(lineas).toContain('1');
    expect(lineas).toContain('Título:');
    expect(lineas).toContain('Pagar factura');
    expect(lineas).toContain('Descripción:');
    expect(lineas).toContain('Antes del viernes');
    expect(lineas).toContain('Estado:');
    expect(lineas).toContain('todo');
    expect(lineas).toContain('Prioridad:');
    expect(lineas).toContain('high');
    expect(lineas).toContain('Creada:');
    expect(lineas).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    expectNoStack(result);
  });

  it('muestra las 6 filas del contrato', () => {
    const home = createHome();
    runCli(['create', 'Comprar leche'], { home });

    const result = runCli(['show', '1'], { home });
    expect(result.status).toBe(0);

    const filas = result.stdout
      .trim()
      .split('\n')
      .map((linea) => linea.trim());
    expect(filas).toHaveLength(6);
    expect(filas[0]).toMatch(/^ID:\s+1$/);
    expect(filas[1]).toMatch(/^Título:\s+Comprar leche$/);
    expect(filas[2]).toMatch(/^Descripción:/);
    expect(filas[3]).toMatch(/^Estado:\s+todo$/);
    expect(filas[4]).toMatch(/^Prioridad:\s+medium$/);
    expect(filas[5]).toMatch(/^Creada:\s+\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('ID inexistente → exit 1 con mensaje claro', () => {
    const home = createHome();
    const result = runCli(['show', '99'], { home });

    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe('Error: no existe la tarea con ID 99.');
    expectNoStack(result);
  });

  it('ID no numérico → exit 1', () => {
    const home = createHome();
    const result = runCli(['show', 'abc'], { home });

    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe(
      'Error: el ID debe ser un número entero positivo. Recibido: "abc".',
    );
    expectNoStack(result);
  });
});

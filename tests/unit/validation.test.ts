import { describe, expect, it } from 'vitest';
import { CliError } from '../../src/utils/errors';
import {
  assertPriority,
  assertStatus,
  assertTitle,
  parseTaskId,
} from '../../src/utils/validation';

// T007 — Reglas de validación V1/V3/V4 citadas textualmente de data-model.md.
function catchError(fn: () => unknown): CliError {
  try {
    fn();
  } catch (error) {
    if (error instanceof CliError) return error;
    throw error;
  }
  throw new Error('se esperaba un CliError y no se lanzó ninguno');
}

describe('parseTaskId (V4 — entero positivo)', () => {
  it('acepta enteros positivos', () => {
    expect(parseTaskId('1')).toBe(1);
    expect(parseTaskId('42')).toBe(42);
  });

  it('rechaza texto no numérico con el mensaje del contrato', () => {
    const error = catchError(() => parseTaskId('abc'));
    expect(error.message).toBe(
      'el ID debe ser un número entero positivo. Recibido: "abc".',
    );
    expect(error.exitCode).toBe(1);
  });

  it('rechaza cero y negativos', () => {
    expect(catchError(() => parseTaskId('0')).message).toBe(
      'el ID debe ser un número entero positivo. Recibido: "0".',
    );
    expect(catchError(() => parseTaskId('-3')).exitCode).toBe(1);
  });

  it('rechaza decimales', () => {
    expect(catchError(() => parseTaskId('1.5')).exitCode).toBe(1);
  });
});

describe('assertTitle (V1 — tras trim() no puede quedar vacío)', () => {
  it('devuelve el título recortado cuando tiene contenido', () => {
    expect(assertTitle('Comprar leche')).toBe('Comprar leche');
    expect(assertTitle('  Comprar leche  ')).toBe('Comprar leche');
  });

  it('rechaza títulos vacíos o solo espacios', () => {
    expect(catchError(() => assertTitle('')).message).toBe(
      'el título no puede estar vacío.',
    );
    expect(catchError(() => assertTitle('   ')).message).toBe(
      'el título no puede estar vacío.',
    );
    expect(catchError(() => assertTitle('   ')).exitCode).toBe(1);
  });

  it('no impone longitud máxima (V1: el spec no define límite)', () => {
    const largo = 't'.repeat(500);
    expect(assertTitle(largo)).toBe(largo);
  });
});

describe('assertPriority (V3 — solo high|medium|low, default medium)', () => {
  it('usa medium cuando se omite', () => {
    expect(assertPriority(undefined)).toBe('medium');
  });

  it('acepta high, medium y low', () => {
    expect(assertPriority('high')).toBe('high');
    expect(assertPriority('medium')).toBe('medium');
    expect(assertPriority('low')).toBe('low');
  });

  it('rechaza valores inválidos citando los válidos', () => {
    const error = catchError(() => assertPriority('urgent'));
    expect(error.message).toBe(
      'prioridad inválida "urgent". Valores válidos: high, medium, low.',
    );
    expect(error.exitCode).toBe(1);
  });
});

describe('assertStatus — solo todo|in-progress|done', () => {
  it('acepta los tres estados', () => {
    expect(assertStatus('todo')).toBe('todo');
    expect(assertStatus('in-progress')).toBe('in-progress');
    expect(assertStatus('done')).toBe('done');
  });

  it('rechaza estados desconocidos citando los válidos', () => {
    const error = catchError(() => assertStatus('flying'));
    expect(error.message).toBe(
      'estado inválido "flying". Valores válidos: todo, in-progress, done.',
    );
    expect(error.exitCode).toBe(1);
  });
});

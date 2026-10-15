import { describe, expect, it } from 'vitest';
import { deletePrompt, isInteractive, parseConfirmation } from '../../src/utils/prompts';

// T031 — Confirmación de borrado (research.md R5):
// `s|S|si|sí` confirma; cualquier otra respuesta — incluido Enter —
// cancela; el valor por defecto es N.
describe('parseConfirmation', () => {
  it('confirma con s, S, si o sí (sin distinguir mayúsculas)', () => {
    expect(parseConfirmation('s')).toBe(true);
    expect(parseConfirmation('S')).toBe(true);
    expect(parseConfirmation('si')).toBe(true);
    expect(parseConfirmation('Si')).toBe(true);
    expect(parseConfirmation('SI')).toBe(true);
    expect(parseConfirmation('sí')).toBe(true);
    expect(parseConfirmation('Sí')).toBe(true);
    expect(parseConfirmation('SÍ')).toBe(true);
  });

  it('ignora espacios alrededor de la respuesta', () => {
    expect(parseConfirmation('  s  ')).toBe(true);
    expect(parseConfirmation('\tsí\n')).toBe(true);
  });

  it('cancela con cualquier otra respuesta, incluido Enter (default N)', () => {
    expect(parseConfirmation('')).toBe(false); // Enter
    expect(parseConfirmation('   ')).toBe(false);
    expect(parseConfirmation('n')).toBe(false);
    expect(parseConfirmation('N')).toBe(false);
    expect(parseConfirmation('no')).toBe(false);
    expect(parseConfirmation('y')).toBe(false);
    expect(parseConfirmation('1')).toBe(false);
    expect(parseConfirmation('yes')).toBe(false);
    expect(parseConfirmation('ssí')).toBe(false);
  });

  it('cancela con entradas no definidas (null/undefined)', () => {
    expect(parseConfirmation(null)).toBe(false);
    expect(parseConfirmation(undefined)).toBe(false);
  });
});

describe('deletePrompt — mensaje del contrato', () => {
  it('construye el prompt con ID, título y default (s/N)', () => {
    expect(deletePrompt(1, 'Comprar leche')).toBe(
      '¿Eliminar la tarea 1 "Comprar leche"? (s/N) ',
    );
  });
});

describe('isInteractive — detección de TTY (FR-009)', () => {
  it('es una función booleana', () => {
    expect(typeof isInteractive()).toBe('boolean');
  });
});

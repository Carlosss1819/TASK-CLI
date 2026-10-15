import { describe, expect, it } from 'vitest';
import { canTransition, validTransitionsFrom } from '../../src/utils/transitions';

// T022 — Matriz de transiciones 3×3 completa de data-model.md:
// 4 celdas válidas, 5 rechazadas, incluida la auto-transición X → X.
const ESTADOS = ['todo', 'in-progress', 'done'] as const;

// Las únicas 4 transiciones válidas del spec (FR-006).
const VALIDAS: ReadonlyArray<readonly [string, string]> = [
  ['todo', 'in-progress'],
  ['in-progress', 'done'],
  ['in-progress', 'todo'],
  ['done', 'todo'],
];

describe('canTransition — matriz 3×3', () => {
  it('acepta exactamente las 4 transiciones válidas del spec', () => {
    for (const [from, to] of VALIDAS) {
      expect(canTransition(from as never, to as never)).toBe(true);
    }
  });

  it('rechaza las 5 combinaciones restantes', () => {
    const invalidas: Array<readonly [string, string]> = [];
    for (const from of ESTADOS) {
      for (const to of ESTADOS) {
        const esValida = VALIDAS.some(([f, t]) => f === from && t === to);
        if (!esValida) invalidas.push([from, to]);
      }
    }

    expect(invalidas).toHaveLength(5);
    for (const [from, to] of invalidas) {
      expect(canTransition(from as never, to as never)).toBe(false);
    }
  });

  it('rechaza la auto-transición X → X', () => {
    for (const estado of ESTADOS) {
      expect(canTransition(estado as never, estado as never)).toBe(false);
    }
  });

  it('rechaza explícitamente todo → done (FR-007)', () => {
    expect(canTransition('todo', 'done')).toBe(false);
  });
});

describe('validTransitionsFrom — para mensajes de error', () => {
  it('enumera las transiciones válidas desde cada estado', () => {
    expect(validTransitionsFrom('todo')).toEqual(['in-progress']);
    expect(validTransitionsFrom('in-progress')).toEqual(['done', 'todo']);
    expect(validTransitionsFrom('done')).toEqual(['todo']);
  });
});

import type { Status } from './validation';

// T024 — Máquina de transiciones (research.md R4): función pura sobre un
// mapa inmutable. Solo las 4 transiciones válidas del spec (FR-006);
// cualquier otra — incluida la identidad X → X — es inválida (FR-007).
const TRANSITIONS: Record<Status, readonly Status[]> = {
  todo: ['in-progress'],
  'in-progress': ['done', 'todo'],
  done: ['todo'],
};

export function canTransition(from: Status, to: Status): boolean {
  return TRANSITIONS[from].includes(to);
}

export function validTransitionsFrom(from: Status): readonly Status[] {
  return TRANSITIONS[from];
}

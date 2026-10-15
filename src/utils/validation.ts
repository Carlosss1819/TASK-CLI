import { CliError } from './errors';

// T010 — Helpers de validación: reglas V1/V3/V4 de data-model.md.
export type Priority = 'high' | 'medium' | 'low';
export type Status = 'todo' | 'in-progress' | 'done';

export const PRIORITIES: readonly Priority[] = ['high', 'medium', 'low'];
export const STATUSES: readonly Status[] = ['todo', 'in-progress', 'done'];

// V4 — el ID debe ser un entero positivo; inexistente o no numérico → exit 1.
export function parseTaskId(raw: string): number {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed) || Number(trimmed) < 1) {
    throw new CliError(
      `el ID debe ser un número entero positivo. Recibido: "${raw}".`,
    );
  }
  return Number(trimmed);
}

// V1 — obligatorio; tras `trim()` no puede quedar vacío. Devuelve recortado.
export function assertTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new CliError('el título no puede estar vacío.');
  }
  return trimmed;
}

// V3 — solo high|medium|low; default `medium` si se omite en `create`.
export function assertPriority(priority: string | undefined): Priority {
  if (priority === undefined) return 'medium';
  if ((PRIORITIES as readonly string[]).includes(priority)) {
    return priority as Priority;
  }
  throw new CliError(
    `prioridad inválida "${priority}". Valores válidos: high, medium, low.`,
  );
}

// Solo todo|in-progress|done (FR-002, FR-006).
export function assertStatus(status: string): Status {
  if ((STATUSES as readonly string[]).includes(status)) {
    return status as Status;
  }
  throw new CliError(
    `estado inválido "${status}". Valores válidos: todo, in-progress, done.`,
  );
}

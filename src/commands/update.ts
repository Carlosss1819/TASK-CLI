import type { Command } from 'commander';
import { openDatabase } from '../db/connection';
import { getTaskById, updateTask } from '../db/tasks';
import { CliError } from '../utils/errors';
import { assertPriority, assertTitle, parseTaskId, type Priority } from '../utils/validation';

// T029 — Comando `update` (FR-008): solo título, descripción o prioridad;
// el status NUNCA se modifica aquí (V7 de data-model.md).
export interface UpdateOptions {
  title?: string;
  description?: string;
  priority?: string;
}

export interface UpdateFields {
  title?: string;
  description?: string;
  priority?: Priority;
}

// Validador puro V7: exige al menos uno de --title|--description|--priority
// y reutiliza V1 (título) y V3 (prioridad).
export function collectUpdates(options: UpdateOptions): UpdateFields {
  const updates: UpdateFields = {};

  if (options.title !== undefined) updates.title = assertTitle(options.title);
  if (options.description !== undefined) {
    updates.description = options.description;
  }
  if (options.priority !== undefined) {
    updates.priority = assertPriority(options.priority);
  }

  if (Object.keys(updates).length === 0) {
    throw new CliError(
      'indica al menos un campo a actualizar: --title, --description o --priority.',
    );
  }

  return updates;
}

export function register(program: Command): void {
  program
    .command('update')
    .description(
      'Actualizar título, descripción o prioridad de una tarea (no cambia el estado)',
    )
    .argument('<id>', 'ID numérico de la tarea')
    .option('--title <título>', 'nuevo título de la tarea')
    .option('--description <texto>', 'nueva descripción de la tarea')
    .option('--priority <prioridad>', 'nueva prioridad: high, medium o low')
    .action((idRaw: string, options: UpdateOptions) => {
      const id = parseTaskId(idRaw);
      const updates = collectUpdates(options);

      const db = openDatabase();
      try {
        const task = getTaskById(db, id);
        if (!task) {
          throw new CliError(`no existe la tarea con ID ${id}.`);
        }
        updateTask(db, id, updates);
        console.log(`Tarea ${id} actualizada.`);
      } finally {
        db.close();
      }
    });
}

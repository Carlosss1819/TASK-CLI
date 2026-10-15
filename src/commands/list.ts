import type { Command } from 'commander';
import { openDatabase } from '../db/connection';
import { listTasks } from '../db/tasks';
import { CliError } from '../utils/errors';
import { renderTasksTable } from '../utils/output';
import {
  PRIORITIES,
  STATUSES,
  type Priority,
  type Status,
} from '../utils/validation';

// T020 — Comando `list` (FR-003…FR-005): filtros AND (V5), orden V6 y
// mensajes exactos del contrato contracts/commands.md.
export interface ListOptions {
  status?: string;
  priority?: string;
}

export function register(program: Command): void {
  program
    .command('list')
    .description('Listar tareas en tabla, con filtros opcionales')
    .option('--status <estado>', 'filtrar por estado: todo, in-progress o done')
    .option('--priority <prioridad>', 'filtrar por prioridad: high, medium o low')
    .action((options: ListOptions) => {
      const filters: { status?: Status; priority?: Priority } = {};

      if (options.status !== undefined) {
        if (!(STATUSES as readonly string[]).includes(options.status)) {
          throw new CliError(
            `valor inválido para --status "${options.status}". Valores válidos: todo, in-progress, done.`,
          );
        }
        filters.status = options.status as Status;
      }

      if (options.priority !== undefined) {
        if (!(PRIORITIES as readonly string[]).includes(options.priority)) {
          throw new CliError(
            `valor inválido para --priority "${options.priority}". Valores válidos: high, medium, low.`,
          );
        }
        filters.priority = options.priority as Priority;
      }

      const db = openDatabase();
      try {
        const tasks = listTasks(db, filters);

        if (tasks.length === 0) {
          const conFiltros =
            filters.status !== undefined || filters.priority !== undefined;
          console.log(
            conFiltros
              ? 'No hay tareas que coincidan con el filtro.'
              : 'No hay tareas.',
          );
          return;
        }

        console.log(renderTasksTable(tasks));
      } finally {
        db.close();
      }
    });
}

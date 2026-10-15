import type { Command } from 'commander';
import { openDatabase } from '../db/connection';
import { insertTask } from '../db/tasks';
import { CliError } from '../utils/errors';
import { assertPriority, assertTitle } from '../utils/validation';

// T017 — Comando `create` (FR-001, FR-002): sintaxis y mensajes exactos
// del contrato contracts/commands.md.
export function register(program: Command): void {
  program
    .command('create')
    .description('Crear una tarea nueva con título obligatorio')
    .argument('[título]', 'título de la tarea (obligatorio y no vacío)')
    .option(
      '--priority <prioridad>',
      'prioridad: high, medium o low (por defecto medium)',
    )
    .option('--description <texto>', 'descripción opcional de la tarea')
    .action(
      (
        titulo: string | undefined,
        options: { priority?: string; description?: string },
      ) => {
        if (titulo === undefined) {
          throw new CliError(
            'falta el argumento obligatorio <título>. Uso: task-cli create <título> [--priority high|medium|low] [--description <texto>]',
          );
        }

        // V1 (título) y V3 (prioridad) antes de tocar la base de datos.
        const title = assertTitle(titulo);
        const priority = assertPriority(options.priority);
        const description = options.description ?? null;

        const db = openDatabase();
        try {
          const task = insertTask(db, { title, description, priority });
          console.log(
            `Tarea ${task.id} creada: "${task.title}" (prioridad: ${task.priority}, estado: ${task.status})`,
          );
        } finally {
          db.close();
        }
      },
    );
}

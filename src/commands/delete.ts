import type { Command } from 'commander';
import { openDatabase } from '../db/connection';
import { deleteTask, getTaskById } from '../db/tasks';
import { CliError } from '../utils/errors';
import { confirmDelete, isInteractive } from '../utils/prompts';
import { parseTaskId } from '../utils/validation';

// T034 — Comando `delete` (FR-009): --force / interactivo / no interactivo,
// con los mensajes exactos del contrato contracts/commands.md.
export function register(program: Command): void {
  program
    .command('delete')
    .description(
      'Eliminar una tarea por su ID (pide confirmación salvo con --force)',
    )
    .argument('<id>', 'ID numérico de la tarea')
    .option('--force', 'eliminar sin confirmación')
    .action(async (idRaw: string, options: { force?: boolean }) => {
      const id = parseTaskId(idRaw);

      const db = openDatabase();
      try {
        const task = getTaskById(db, id);
        if (!task) {
          throw new CliError(`no existe la tarea con ID ${id}.`);
        }

        if (!options.force) {
          // Sin TTY y sin --force → error y la tarea queda intacta.
          if (!isInteractive()) {
            throw new CliError(
              'la entrada no es interactiva; usa --force para eliminar sin confirmación.',
            );
          }
          const confirmed = await confirmDelete(task.id, task.title);
          if (!confirmed) {
            // Cancelar es una decisión del usuario: exit 0, tarea intacta.
            console.log('Eliminación cancelada.');
            return;
          }
        }

        deleteTask(db, id);
        console.log(`Tarea ${id} eliminada.`);
      } finally {
        db.close();
      }
    });
}

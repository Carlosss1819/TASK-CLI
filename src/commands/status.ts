import type { Command } from 'commander';
import { openDatabase } from '../db/connection';
import { getTaskById, setStatus } from '../db/tasks';
import { CliError } from '../utils/errors';
import { canTransition, validTransitionsFrom } from '../utils/transitions';
import { assertStatus, parseTaskId } from '../utils/validation';

// T025 — Comando `status` (FR-006, FR-007): aplica la matriz de
// data-model.md con mensajes exactos del contrato contracts/commands.md.
export function register(program: Command): void {
  program
    .command('status')
    .description(
      'Cambiar el estado de una tarea (todo → in-progress → done, o retroceso a todo)',
    )
    .argument('<id>', 'ID numérico de la tarea')
    .argument('<nuevoEstado>', 'nuevo estado: todo, in-progress o done')
    .action((idRaw: string, nuevoEstadoRaw: string) => {
      const id = parseTaskId(idRaw);
      const to = assertStatus(nuevoEstadoRaw);

      const db = openDatabase();
      try {
        const task = getTaskById(db, id);
        if (!task) {
          throw new CliError(`no existe la tarea con ID ${id}.`);
        }

        if (!canTransition(task.status, to)) {
          const validas = validTransitionsFrom(task.status).join(', ');
          throw new CliError(
            `no se puede cambiar la tarea ${id} de "${task.status}" a "${to}". Transiciones válidas desde "${task.status}": ${validas}.`,
          );
        }

        setStatus(db, id, to);
        console.log(`Tarea ${id}: ${task.status} → ${to}`);
      } finally {
        db.close();
      }
    });
}

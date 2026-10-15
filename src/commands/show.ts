import type { Command } from 'commander';
import { openDatabase } from '../db/connection';
import { getTaskById } from '../db/tasks';
import { CliError } from '../utils/errors';
import { formatCreated } from '../utils/output';
import { parseTaskId } from '../utils/validation';

// T037 — Comando `show` (FR-014): todas las filas de la tarea, incluida la
// descripción, con el formato exacto de contracts/commands.md.
// `padEnd(11)` + un espacio alinea el valor en la columna 13; etiquetas más
// largas (Descripción:) conservan un solo espacio, como en el contrato.
const FILA = (etiqueta: string, valor: string): string =>
  `${(etiqueta + ':').padEnd(11)} ${valor}`;

export function register(program: Command): void {
  program
    .command('show')
    .description('Ver el detalle completo de una tarea por su ID')
    .argument('<id>', 'ID numérico de la tarea')
    .action((idRaw: string) => {
      const id = parseTaskId(idRaw);

      const db = openDatabase();
      try {
        const task = getTaskById(db, id);
        if (!task) {
          throw new CliError(`no existe la tarea con ID ${id}.`);
        }

        console.log(FILA('ID', String(task.id)));
        console.log(FILA('Título', task.title));
        console.log(FILA('Descripción', task.description ?? ''));
        console.log(FILA('Estado', task.status));
        console.log(FILA('Prioridad', task.priority));
        console.log(FILA('Creada', formatCreated(task.created_at)));
      } finally {
        db.close();
      }
    });
}

import Table from 'cli-table3';
import type { Priority, Status } from './validation';

// T011 — Helpers de presentación (research.md R6, principios IX).
// Colores ANSI solo en las columnas Estado y Prioridad.
export interface TaskView {
  id: number;
  title: string;
  status: Status;
  priority: Priority;
  created_at: string;
}

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

const STATUS_COLORS: Record<Status, string> = {
  todo: YELLOW,
  'in-progress': CYAN,
  done: GREEN,
};

const PRIORITY_COLORS: Record<Priority, string> = {
  high: RED,
  medium: YELLOW,
  low: GREEN,
};

// Fecha ISO-8601 UTC → "YYYY-MM-DD HH:MM:SS" (research.md R3).
export function formatCreated(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export function colorStatus(status: Status): string {
  const color = STATUS_COLORS[status];
  return color ? `${color}${status}${RESET}` : status;
}

export function colorPriority(priority: Priority): string {
  const color = PRIORITY_COLORS[priority];
  return color ? `${color}${priority}${RESET}` : priority;
}

// Tabla cli-table3 con cabeceras en español (FR-013).
export function renderTasksTable(tasks: TaskView[]): string {
  const table = new Table({
    head: ['ID', 'Título', 'Estado', 'Prioridad', 'Creada'],
    // Sin color por defecto en cabeceras/bordes: el color queda SOLO en las
    // columnas Estado y Prioridad (principio IX).
    style: { head: [], border: [] },
  });
  for (const task of tasks) {
    table.push([
      String(task.id),
      task.title,
      colorStatus(task.status),
      colorPriority(task.priority),
      formatCreated(task.created_at),
    ]);
  }
  return table.toString();
}

// Errores por stderr con el prefijo del contrato, jamás con stack (FR-011).
export function printError(message: string): void {
  process.stderr.write(`Error: ${message}\n`);
}

// Traducción de las secciones generadas por --help de Commander (FR-013).
export function translateHelp(text: string): string {
  return text
    .replace(/^Usage:/gm, 'Uso:')
    .replace(/^Options:/gm, 'Opciones:')
    .replace(/^Commands:/gm, 'Comandos:')
    .replace(/^Arguments:/gm, 'Argumentos:')
    .replace(/display help for a specified command/g, 'mostrar la ayuda de un comando')
    .replace(/display help for command/g, 'mostrar la ayuda del comando')
    .replace(/output the version number/g, 'mostrar el número de versión')
    .replace(/\[options\]/g, '[opciones]')
    .replace(/\[command\]/g, '[comando]')
    .replace(/Run "([^"]+)" for usage\./g, 'Ejecuta "$1" para ver el uso.');
}

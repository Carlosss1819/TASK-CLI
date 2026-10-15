import readline from 'node:readline';

// T033 — Confirmación interactiva con node:readline (research.md R5).
// Sin TTY jamás se bloquea ni se borra sin --force; default N.
export function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY);
}

// `s`/`S`/`si`/`sí` (con o sin mayúsculas) confirma; cualquier otra
// respuesta o Enter cancela (por defecto N).
export function parseConfirmation(
  answer: string | null | undefined,
): boolean {
  if (answer === null || answer === undefined) return false;
  const normalized = answer.trim().toLowerCase();
  return normalized === 's' || normalized === 'si' || normalized === 'sí';
}

export function deletePrompt(id: number, title: string): string {
  return `¿Eliminar la tarea ${id} "${title}"? (s/N) `;
}

export function confirmDelete(id: number, title: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(deletePrompt(id, title), (answer) => {
      rl.close();
      resolve(parseConfirmation(answer));
    });
  });
}

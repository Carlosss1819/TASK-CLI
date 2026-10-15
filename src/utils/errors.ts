// T009 — CliError: mensaje en español + código de salida (research.md R7).
// El stack nunca se imprime: index.ts solo usa `message` (FR-011, SC-005).
export class CliError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode: number = 1) {
    super(message);
    this.name = 'CliError';
    this.exitCode = exitCode;
  }
}

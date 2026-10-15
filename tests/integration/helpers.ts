import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Ejecuta el CLI como proceso con HOME/USERPROFILE temporal (research.md R9),
// verificando stdout/stderr y códigos de salida reales (research.md R10).
export interface CliResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

const homes: string[] = [];

export function createHome(): string {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'task-cli-'));
  homes.push(home);
  return home;
}

export function cleanupHomes(): void {
  for (const home of homes.splice(0)) {
    fs.rmSync(home, { recursive: true, force: true });
  }
}

export function runCli(
  args: string[],
  options: { home: string; input?: string },
): CliResult {
  const entry = path.join(process.cwd(), 'src', 'index.ts');
  const result = spawnSync(process.execPath, ['--import', 'tsx', entry, ...args], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOME: options.home,
      USERPROFILE: options.home,
    },
    input: options.input,
    encoding: 'utf8',
  });

  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

// SC-005 — ningún error puede contener stack traces.
export function expectNoStack(result: CliResult): void {
  const combined = result.stdout + result.stderr;
  if (/\n\s+at\s/.test(combined) || combined.includes('node:internal')) {
    throw new Error(`La salida contiene un stack trace:\n${combined}`);
  }
}

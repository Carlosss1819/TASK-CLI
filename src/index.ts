#!/usr/bin/env node
// T015 — Punto de entrada (bin): Commander en español, captura global de
// errores → mensaje por stderr + exit 1, jamás stack traces (FR-011, FR-013).
import { Command, CommanderError } from 'commander';
import { register as registerCreate } from './commands/create';
import { register as registerDelete } from './commands/delete';
import { register as registerList } from './commands/list';
import { register as registerShow } from './commands/show';
import { register as registerStatus } from './commands/status';
import { register as registerUpdate } from './commands/update';
import { CliError } from './utils/errors';
import { printError, translateHelp } from './utils/output';

const VERSION = '1.0.0';

// Orden canónico de comandos según contracts/commands.md.
const COMMAND_ORDER = ['create', 'list', 'show', 'status', 'update', 'delete'];

// Salida de Commander traducida al español; los errores de parseo se
// remapean abajo (outputError los silencia para no filtrar texto inglés).
const outputConfig = {
  writeOut: (str: string): boolean => process.stdout.write(translateHelp(str)),
  writeErr: (str: string): boolean => process.stderr.write(translateHelp(str)),
  outputError: (): void => undefined,
};

// Mensajes propios en español para los códigos de error de Commander (R8).
function mapCommanderError(error: CommanderError, available: string[]): string {
  const message = error.message ?? '';

  const unknownOption = /unknown option '([^']+)'/.exec(message);
  if (unknownOption) {
    return `opción desconocida "${unknownOption[1]}". Usa task-cli --help para ver las opciones disponibles.`;
  }

  const missingArgument = /missing required argument '([^']+)'/.exec(message);
  if (missingArgument) {
    return `falta el argumento obligatorio <${missingArgument[1]}>.`;
  }

  if (error.code === 'commander.unknownCommand') {
    return `comando desconocido. Comandos disponibles: ${available.join(', ')}.`;
  }

  return `comando no válido. Comandos disponibles: ${available.join(', ')}. Usa task-cli --help para ver la ayuda.`;
}

export function buildProgram(): Command {
  const program = new Command();

  program
    .name('task-cli')
    .description('CLI de gestión de tareas personales')
    .version(VERSION)
    .helpOption('-h, --help', 'mostrar la ayuda del comando')
    .exitOverride()
    .configureOutput(outputConfig);

  // Los comandos se registran aquí a medida que cada historia se implementa
  // (T018, T021, T026, T030, T035, T038).
  registerCreate(program);
  registerList(program);
  registerShow(program);
  registerStatus(program);
  registerUpdate(program);
  registerDelete(program);

  // Los subcomandos heredan exitOverride/configureOutput de la raíz; se
  // reafirma explícitamente para que ningún error quede en inglés.
  for (const command of program.commands) {
    command.exitOverride().configureOutput(outputConfig);
  }

  return program;
}

async function main(): Promise<void> {
  const program = buildProgram();
  // Orden canónico del contrato al anunciar comandos disponibles (FR-013).
  const available = COMMAND_ORDER.filter((name) =>
    program.commands.some((command) => command.name() === name),
  );
  const firstArg = process.argv[2];

  // Comando desconocido → mensaje exacto del contrato, exit 1 (sin que
  // Commander llegue a imprimir su versión en inglés).
  if (
    firstArg !== undefined &&
    !firstArg.startsWith('-') &&
    firstArg !== 'help' &&
    !program.commands.some((command) => command.name() === firstArg)
  ) {
    printError(
      `comando desconocido "${firstArg}". Comandos disponibles: ${available.join(', ')}.`,
    );
    process.exit(1);
  }

  // `task-cli` sin argumentos → ayuda en español, exit 0.
  if (process.argv.length <= 2) {
    program.outputHelp();
    process.exit(0);
  }

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof CommanderError) {
      // --help / --version ya imprimieron su salida y piden exit 0.
      if (error.exitCode === 0) {
        process.exit(0);
      }
      printError(mapCommanderError(error, available));
      process.exit(1);
    }
    if (error instanceof CliError) {
      printError(error.message);
      process.exit(error.exitCode);
    }
    // Red de seguridad: nunca se expone error.stack (SC-005).
    printError('Error inesperado: contacta con el desarrollador.');
    process.exit(1);
  }
}

void main();

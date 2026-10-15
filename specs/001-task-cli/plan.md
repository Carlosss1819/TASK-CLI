# Implementation Plan: task-cli

**Branch**: `001-task-cli` | **Date**: 2026-10-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-task-cli/spec.md`

## Summary

CLI personal de gestión de tareas: crear, listar, ver detalle, cambiar
estado, actualizar y eliminar tareas desde la terminal, con persistencia
local en SQLite. Enfoque técnico: TypeScript sobre Node.js LTS,
Commander.js para parseo de comandos, `better-sqlite3` (sin ORM) en
`~/.task-cli/tasks.db`, salida en español con tablas (`cli-table3`), pruebas
con Vitest y distribución global vía `npm install -g`. No quedan
`NEEDS CLARIFICATION`: la constitución fija el stack y `/speckit.clarify`
resolvió los ambigüedades funcionales (idioma de salida, comando `show`,
listado por defecto, estado vacío, borrado no interactivo).

## Technical Context

**Language/Version**: TypeScript sobre Node.js LTS (Node 22.x), ejecución
directa con `tsx` en desarrollo, compilación con `tsc` para publicación.

**Primary Dependencies**: Commander.js (parseo de comandos),
`better-sqlite3` (SQLite sin ORM), `cli-table3` (tablas). Colores con
escapes ANSI directos (sin librería extra) y `node:readline` para
confirmaciones — cumpliendo el principio VIII (sin dependencias
innecesarias).

**Storage**: SQLite local en `~/.task-cli/tasks.db`; se crea el directorio y
la base de datos en el primer uso.

**Testing**: Vitest — unitarios para lógica de negocio (transiciones,
validación, filtros/orden) e integración ejecutando el CLI como proceso con
`HOME`/`USERPROFILE` apuntando a un directorio temporal.

**Target Platform**: Terminal en Windows/macOS/Linux; binario npm instalado
globalmente.

**Project Type**: CLI.

**Performance Goals**: listado < 1 s con hasta 1.000 tareas (SC-003);
crear una tarea percibido en < 10 s (SC-001).

**Constraints**: códigos de salida 0 (éxito) / 1 (error); sin stack traces;
toda salida del usuario en español (FR-013); sin ORMs ni dependencias
innecesarias; funcionamiento 100% offline.

**Scale/Scope**: 1 usuario local; hasta ~1.000 tareas; 6 comandos
(`create`, `list`, `show`, `status`, `update`, `delete`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio (constitución v1.0.0) | Estado | Evidencia en el plan |
|---|----------------------------------|--------|----------------------|
| I | Language & Runtime: TypeScript, Node LTS | PASS | Technical Context: TS sobre Node 22.x LTS, `tsx` para ejecución directa |
| II | Database: SQLite vía `better-sqlite3`, `~/.task-cli/tasks.db`, sin ORM | PASS | Storage: mismo path; data-model.md define SQL plano con `CREATE TABLE` |
| III | Project Structure: plana, por funcionalidad (`commands/`, `db/`, `utils/`) | PASS | Project Structure: árbol exacto bajo `src/`, sin capas adicionales |
| IV | Code Style: funcional, funciones puras, camelCase/PascalCase | PASS | research.md R4/R10: transiciones y filtros como funciones puras testables |
| V | CLI Framework: Commander.js, sin alternativas | PASS | Technical Context: Commander.js como único framework CLI |
| VI | Error Handling: sin stack traces, mensajes accionables, 0/1 | PASS | `utils/errors.ts` (`CliError`) + manejo global en `index.ts`; contrato fija 0/1 |
| VII | Testing: Vitest, tests para toda lógica de negocio | PASS | Testing: unit + integration con Vitest; research.md R10 |
| VIII | Dependencies: sin libs innecesarias, sin ORMs | PASS | Primary Dependencies: solo Commander/better-sqlite3/cli-table3; ANSI y `readline` nativos |
| IX | Output: legible, tablas, colores solo para estados/prioridades | PASS | `utils/output.ts` con `cli-table3`; mapeo de color limitado a columnas Estado/Prioridad |
| X | Distribution: instalable globalmente con `npm install -g` | PASS | research.md R1: `package.json` con `bin` apuntando a `dist/` compilado |

**Evaluación del gate**: PASS (10/10). Sin violaciones, sin justificaciones
pendientes en Complexity Tracking.

**Re-check post-Phase 1**: PASS. Los artefactos de diseño
(research.md, data-model.md, contracts/, quickstart.md) mantienen SQL plano
sin ORM, estructura plana `commands/`/`db/`/`utils/`, mensajes en español
con códigos 0/1 y pruebas Vitest; ninguna decisión de Fase 0/1 altera estos
principios.

## Project Structure

### Documentation (this feature)

```text
specs/001-task-cli/
├── plan.md              # Este archivo (/speckit.plan)
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/           # Fase 1
│   └── commands.md      # Contrato de comandos del CLI
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit.tasks — NO creado por /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── index.ts              # Punto de entrada (bin): Commander, registro de comandos,
│                         # captura global de errores → mensaje español + exit 1
├── commands/
│   ├── create.ts         # task-cli create <título>
│   ├── list.ts           # task-cli list [--status] [--priority]
│   ├── show.ts           # task-cli show <id>
│   ├── status.ts         # task-cli status <id> <nuevo-estado>
│   ├── update.ts         # task-cli update <id> [--title] [--description] [--priority]
│   └── delete.ts         # task-cli delete <id> [--force]
├── db/
│   ├── connection.ts     # Apertura de ~/.task-cli/tasks.db + CREATE TABLE IF NOT EXISTS
│   └── tasks.ts          # Persistencia: CRUD, filtros, orden (SQL plano, sin ORM)
└── utils/
    ├── errors.ts         # CliError (mensaje en español + código de salida)
    ├── output.ts         # Tablas cli-table3, colores ANSI (solo estados/prioridades)
    └── prompts.ts        # Confirmación interactiva (node:readline) + detección de TTY

tests/
├── unit/                 # Transiciones, validación de entrada, filtros/orden, errores
└── integration/          # CLI como proceso con HOME/USERPROFILE temporal
```

**Structure Decision**: Opción 1 (proyecto único) ajustada a la Constitución
(principio III): raíz funcional plana `commands/`, `db/`, `utils/` bajo
`src/`, sin clean architecture ni capas extra. `tests/` en la raíz del repo,
separado por tipo de prueba.

## Complexity Tracking

No aplica: la Constitution Check no detectó violaciones que justificar.

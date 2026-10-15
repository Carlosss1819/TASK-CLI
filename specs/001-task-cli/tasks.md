---

description: "Task list template for feature implementation"
---

# Tasks: task-cli

**Input**: Design documents from `/specs/001-task-cli/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — exigidos por la constitución (principio VII: "toda lógica de negocio debe tener tests" y puerta de calidad `npm test` en verde), no por elección de estilo.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Convención de comandos**: cada módulo en `src/commands/` exporta `register(program)` sin efectos secundarios al importar; `src/index.ts` los invoca. Todos los mensajes al usuario en español según [contracts/commands.md](./contracts/commands.md) (FR-013).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (según plan.md Structure Decision)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure per plan.md (research.md R1).

- [X] T001 Create project manifest in package.json (nombre `task-cli`, `bin` → `dist/index.js`, scripts `dev`/`build`/`test`, engines Node LTS)
- [X] T002 Configure TypeScript compiler in tsconfig.json (`strict`, `src/` → `dist/`, module/node types para Node LTS)
- [X] T003 [P] Install dependencies per plan.md R1 in package.json (runtime: `commander`, `better-sqlite3`, `cli-table3`; dev: `typescript`, `tsx`, `vitest`, `@types/node`)
- [X] T004 [P] Configure Vitest in vitest.config.ts (suites `tests/unit/` e `tests/integration/`, research.md R10)
- [X] T005 [P] Create directory skeleton src/commands/, src/db/, src/utils/, tests/unit/, tests/integration/

**Checkpoint**: `npm install` y `npx vitest run` completan sin errores de configuración.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**?? CRITICAL**: No user story work can begin until this phase is complete

Tests first (deben FALLAR antes de implementar):

- [X] T006 [P] Create tests for error contract in tests/unit/errors.test.ts (CliError: mensaje en español, `exitCode` 1, nunca expone `stack`; research.md R7, FR-011)
- [X] T007 [P] Create tests for validation helpers in tests/unit/validation.test.ts (V1: "tras `trim()` no puede quedar vacío"; V2 descripción opcional; V3: "solo `high|medium|low`; default `medium`"; V4: "entero positivo" — cita textual de data-model.md)
- [X] T008 [P] Create tests for display helpers in tests/unit/output.test.ts (fecha ISO-8601 UTC → `YYYY-MM-DD HH:MM:SS`; colores ANSI solo en Estado/Prioridad; cabeceras `ID, Título, Estado, Prioridad, Creada`; research.md R3, R6)

Implementation:

- [X] T009 [P] Create error class in src/utils/errors.ts (`CliError` con mensaje español + `exitCode`, research.md R7)
- [X] T010 [P] Create validation helpers in src/utils/validation.ts (`parseTaskId`, `assertTitle`, `assertPriority`, `assertStatus` — reglas V1/V3/V4 citadas en T007)
- [X] T011 [P] Create display helpers in src/utils/output.ts (`formatCreated`, colores ANSI de estado/prioridad, `renderTasksTable` con cli-table3, `printError` a stderr, research.md R6)
- [X] T012 [P] Create database connection in src/db/connection.ts (ruta `os.homedir()/.task-cli/tasks.db`, `mkdir recursive`, PRAGMAs WAL/foreign_keys, exporta el SQL `CREATE TABLE IF NOT EXISTS tasks` de data-model.md sin alterar — research.md R2, R9)
- [X] T013 Create tests for persistence layer in tests/unit/db-tasks.test.ts (BD `:memory:` con el esquema de T012: CRUD, filtros combinados AND, orden `created_at DESC, id DESC` — V5/V6 citadas en data-model.md)
- [X] T014 Create persistence functions in src/db/tasks.ts (`insertTask`, `listTasks` con filtros opcional y orden V6, `getTaskById`, `updateTask`, `deleteTask`, `setStatus`; depende de T012, satisface T013)
- [X] T015 Create CLI entry point in src/index.ts (Commander raíz con `exitOverride`/`configureOutput` en español research.md R8, try/catch global → `printError` + exit 1 sin stack research.md R7, registra comandos disponibles)

**Checkpoint**: Foundation ready — `npm test` en verde para unitarios; historias de usuario pueden comenzar.

---

## Phase 3: User Story 1 - Crear tareas (Priority: P1) ?? MVP

**Goal**: El usuario crea una tarea con título obligatorio, prioridad opcional (default `medium`) y descripción opcional; recibe ID autoincremental y estado `todo` (spec FR-001, FR-002).

**Independent Test**: Ejecutar `task-cli create "Comprar leche"` y verificar el mensaje `Tarea 1 creada: … (prioridad: medium, estado: todo)` con exit 0; `create ""` y `create` (sin título) → mensaje de error en español y exit 1; la fila persiste en `tasks.db`.

### Tests for User Story 1 (incluidos por constitución VII)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T016 [P] [US1] Create integration test for creation scenarios in tests/integration/create.test.ts (escenarios §1 de quickstart.md: exit 0 con mensaje, IDs autoincrementales, título vacío/sin argumento/prioridad inválida → exit 1; HOME temporal per research.md R9)

### Implementation for User Story 1

- [X] T017 [US1] Implement create command in src/commands/create.ts (sintaxis y mensajes exactos del contrato `create` en contracts/commands.md; usa `assertTitle`/`assertPriority` de src/utils/validation.ts e `insertTask` de src/db/tasks.ts)
- [X] T018 [US1] Register create command in src/index.ts

**Checkpoint**: User Story 1 fully functional and testable independently (`npx vitest run tests/integration/create.test.ts` en verde).

---

## Phase 4: User Story 2 - Listar tareas (Priority: P1)

**Goal**: Listado en tabla con ID, título, estado, prioridad y fecha de creación; filtros `--status`/`--priority` (AND), orden más recientes primero, todas las tareas por defecto incluidas las `done` (FR-003…FR-005, clarificación Q3).

**Independent Test**: Con tareas variadas, `task-cli list` muestra tabla en español con todas las tareas ordenadas; `--status done` y `--priority high` filtran (e intersectan); lista vacía → `No hay tareas.` y filtro sin coincidencias → `No hay tareas que coincidan con el filtro.` (exit 0); `--status bogus` → exit 1 con valores válidos.

### Tests for User Story 2 (incluidos por constitución VII)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T019 [P] [US2] Create integration test for list scenarios in tests/integration/list.test.ts (escenarios §2–§3 de quickstart.md: tabla con cabeceras en español, orden, filtros AND, mensajes vacíos exactos, filtro inválido exit 1)

### Implementation for User Story 2

- [X] T020 [US2] Implement list command in src/commands/list.ts (sintaxis y mensajes del contrato `list` en contracts/commands.md; `renderTasksTable` de src/utils/output.ts, `listTasks` de src/db/tasks.ts)
- [X] T021 [US2] Register list command in src/index.ts

**Checkpoint**: User Story 1 AND 2 both work independently.

---

## Phase 5: User Story 3 - Cambiar estado de una tarea (Priority: P1)

**Goal**: Transiciones válidas `todo → in-progress`, `in-progress → done`, `in-progress → todo`, `done → todo`; cualquier otra rechazada con mensaje claro y exit 1 (FR-006, FR-007, SC-002).

**Independent Test**: Recorrer las 4 transiciones válidas con exit 0; `todo → done` (y `X → X`) → mensaje con transiciones válidas desde el estado actual y exit 1; ID inexistente → exit 1.

### Tests for User Story 3 (incluidos por constitución VII)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T022 [P] [US3] Create unit tests for transition matrix in tests/unit/transitions.test.ts (matriz 3×3 completa de data-model.md: 4 celdas válidas ✓, 5 rechazadas ✗ incluida la auto-transición `X → X`)
- [X] T023 [P] [US3] Create integration test for status scenarios in tests/integration/status.test.ts (escenarios §4 de quickstart.md)

### Implementation for User Story 3

- [X] T024 [US3] Create transition validator in src/utils/transitions.ts (`canTransition(from, to)` pura con `Record<Status, Status[]>`: `todo: [in-progress]`, `in-progress: [done, todo]`, `done: [todo]` — research.md R4)
- [X] T025 [US3] Implement status command in src/commands/status.ts (sintaxis y mensajes del contrato `status` en contracts/commands.md; usa `canTransition` y `getTaskById`/`setStatus`)
- [X] T026 [US3] Register status command in src/index.ts

**Checkpoint**: All three P1 stories independently functional — MVP completo (spec: US1–US3 son P1).

---

## Phase 6: User Story 4 - Actualizar una tarea (Priority: P2)

**Goal**: Actualizar título, descripción o prioridad por ID; sin tocar `status` (FR-008, V7).

**Independent Test**: `task-cli update 1 --title "…" --priority low` refleja cambios al listar/show; `update 1` sin campos → exit 1; ID inexistente → exit 1; `status` no cambia.

### Tests for User Story 4 (incluidos por constitución VII)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T027 [P] [US4] Create unit tests for update validation in tests/unit/update-validation.test.ts (V7 citada de data-model.md: "exige al menos uno de `--title|--description|--priority`"; "el `status` NO se modifica por `update`"; V1/V3 reusadas)
- [X] T028 [P] [US4] Create integration test for update scenarios in tests/integration/update.test.ts (escenarios §6 de quickstart.md)

### Implementation for User Story 4

- [X] T029 [US4] Implement update command in src/commands/update.ts (sintaxis y mensajes del contrato `update` en contracts/commands.md; exporta `register(program)` + validador puro para T027; usa `updateTask` de src/db/tasks.ts)
- [X] T030 [US4] Register update command in src/index.ts

**Checkpoint**: User Story 4 independently functional without breaking US1–US3.

---

## Phase 7: User Story 5 - Eliminar una tarea (Priority: P2)

**Goal**: Confirmación previa salvo `--force`; sin TTY y sin `--force` → error que sugiere `--force`, exit 1, tarea intacta (FR-009, clarificación Q5).

**Independent Test**: `delete 3 --force` elimina (exit 0); `printf 'n\n' | task-cli delete 2` → exit 1 con mensaje de `--force`; cancelación interactiva → `Eliminación cancelada.` exit 0 y tarea intacta; ID inexistente → exit 1.

### Tests for User Story 5 (incluidos por constitución VII)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T031 [P] [US5] Create unit tests for confirm parsing in tests/unit/prompts.test.ts (respuesta `s|S|si|sí` → confirmar; cualquier otra incl. Enter → cancelar, por defecto `N`; research.md R5)
- [X] T032 [P] [US5] Create integration test for delete scenarios in tests/integration/delete.test.ts (escenarios §7 de quickstart.md: `--force` exit 0, stdin no TTY → exit 1 sin eliminar, ID inexistente exit 1)

### Implementation for User Story 5

- [X] T033 [US5] Create confirmation prompt in src/utils/prompts.ts (detección `process.stdin.isTTY`/`stdout.isTTY`, `node:readline`, default `N`, mensaje `¿Eliminar la tarea {id} "{título}"? (s/N) ` — research.md R5)
- [X] T034 [US5] Implement delete command in src/commands/delete.ts (sintaxis y mensajes del contrato `delete` en contracts/commands.md; rama `--force` / interactiva / no interactiva)
- [X] T035 [US5] Register delete command in src/index.ts

**Checkpoint**: User Story 5 independently functional; borrado seguro en scripts (sin TTY jamás borra).

---

## Phase 8: User Story 6 - Ver detalle de una tarea (Priority: P2)

**Goal**: `show <id>` imprime todos los campos incluida la descripción; ID inexistente → exit 1 (FR-014, clarificación Q2).

**Independent Test**: `task-cli show 2` muestra las 6 filas incl. `Descripción:`; `task-cli show 99` → mensaje `no existe la tarea con ID 99` y exit 1.

### Tests for User Story 6 (incluidos por constitución VII)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T036 [P] [US6] Create integration test for show scenarios in tests/integration/show.test.ts (escenarios §5 de quickstart.md)

### Implementation for User Story 6

- [X] T037 [US6] Implement show command in src/commands/show.ts (sintaxis y mensajes del contrato `show` en contracts/commands.md; usa `parseTaskId` de src/utils/validation.ts y `getTaskById`)
- [X] T038 [US6] Register show command in src/index.ts

**Checkpoint**: All six user stories independently functional.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T039 [P] Run end-to-end validation from specs/001-task-cli/quickstart.md (escenarios §1–§10 y criterio de validación global) y corregir desviaciones de specs/001-task-cli/contracts/commands.md
- [X] T040 [P] Review output consistency in src/ y specs/001-task-cli/contracts/commands.md (FR-013: mensajes/cabeceras en español; FR-011/SC-005: cero stack traces; principio IX: colores solo en Estado/Prioridad)
- [X] T041 Create usage documentation in README.md (instalación global `npm install -g`, comandos, ejemplos — en español según CLAUDE.md)
- [X] T042 Run quality gate per specs/001-task-cli/plan.md (constitución: `npm test` en verde + `npm run build` sin errores)
- [X] T043 Verify global distribution in package.json (`npm install -g .`, `task-cli --version` y `task-cli --help` en español — FR-012, research.md R1)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3–8)**: All depend on Foundational phase completion
  - Priority order: US1 (P1) → US2 (P1) → US3 (P1) → US4 (P2) → US5 (P2) → US6 (P2)
  - After Foundational, stories are independently implementable; US1–US3 pueden secuenciarse en cualquier orden (sin dependencias entre ellas)
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (Crear, P1)**: After Foundational — no dependencies on other stories
- **User Story 2 (Listar, P1)**: After Foundational — integra con US1 solo a nivel de datos (`db/tasks.ts` ya existe)
- **User Story 3 (Estado, P1)**: After Foundational — independiente
- **User Story 4 (Actualizar, P2)**: After Foundational — independiente
- **User Story 5 (Eliminar, P2)**: After Foundational — independiente
- **User Story 6 (Detalle, P2)**: After Foundational — independiente

### Within Each User Story

- Tests escritos primero y FALLANDO antes de la implementación
- Validación/utilidades → comando → registro en `src/index.ts` → test de integración en verde
- Historia completa antes de pasar a la siguiente prioridad

### Parallel Opportunities

- T001–T005: T002, T003, T004, T005 en paralelo tras T001
- T006–T008 en paralelo; T009–T012 en paralelo (archivos distintos)
- Todas las tareas de test marcadas [P] de una misma historia en paralelo
- Tras Foundational, historias distintas pueden ejecutarse en paralelo (archivos distintos; solo los registros en `src/index.ts` deben secuenciarse)

---

## Parallel Example: User Story 3

```bash
# Launch both tests for User Story 3 together (write FIRST, expect FAIL):
Task: "T022 [P] [US3] Create unit tests for transition matrix in tests/unit/transitions.test.ts"
Task: "T023 [P] [US3] Create integration test for status scenarios in tests/integration/status.test.ts"

# Then sequentially: T024 (transitions.ts) → T025 (status.ts) → T026 (register)
```

## Parallel Example: User Story 5

```bash
# Launch both tests for User Story 5 together (write FIRST, expect FAIL):
Task: "T031 [P] [US5] Create unit tests for confirm parsing in tests/unit/prompts.test.ts"
Task: "T032 [P] [US5] Create integration test for delete scenarios in tests/integration/delete.test.ts"

# Then sequentially: T033 (prompts.ts) → T034 (delete.ts) → T035 (register)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: `npx vitest run tests/integration/create.test.ts` + prueba manual `task-cli create "…"`
5. Demo: crear tareas ya funciona

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 (crear) → test independiente → demo (MVP!)
3. US2 (listar) → test independiente → demo (crear → listar)
4. US3 (estados) → test independiente → demo (flujo completo P1: crear → listar → completar)
5. US4–US6 (actualizar, eliminar, detalle) → cada una suma valor sin romper las anteriores

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 + US2 (P1)
   - Developer B: US3 (P1) + US4 (P2)
   - Developer C: US5 + US6 (P2)
3. Solo coordinar los registros en src/index.ts (ediciones secuenciales)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable (cada una tiene test de integración propio con HOME temporal)
- Tests escritos primero: deben FALLAR antes de implementar (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Mensajes exactos al usuario: contracts/commands.md es la fuente canónica (FR-013)
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

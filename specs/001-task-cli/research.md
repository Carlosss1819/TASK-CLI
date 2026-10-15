# Research: task-cli

**Branch**: `001-task-cli` | **Date**: 2026-10-01

**Input**: [spec.md](./spec.md), [plan.md](./plan.md),
`.specify/memory/constitution.md` v1.0.0

> Fase 0. Technical Context no contiene `NEEDS CLARIFICATION` (la
> constitución fija el stack completo). Esta fase documenta las decisiones
> técnicas abiertas que el spec no prescribe, con formato
> Decisión / Rationale / Alternativas consideradas.

## R1. Distribución y ejecución

- **Decision**: Compilar con `tsc` a `dist/` y publicar `package.json` con
  campo `bin` (`"task-cli": "dist/index.js"` con shebang `#!/usr/bin/env
  node`) para `npm install -g`. En desarrollo, ejecución directa con `tsx`
  (`npm run dev -- <args>`). `tsx` y `typescript` quedan como
  devDependencies.
- **Rationale**: La constitución exige instalación global con `npm install
  -g` y ejecución directa con `tsx o similar`. Publicar JS compilado evita
  exigir `tsx` en runtime y arranca más rápido; `tsx` cómoda en desarrollo
  sin paso de build.
- **Alternativas consideradas**: (a) publicar con `tsx` en runtime —
  dependencia pesada y arranque lento para un bin; (b) solo JS a mano —
  pierde TypeScript (principio I); (c) bundlers (esbuild/tsup) —
  innecesario para un paquete pequeño con pocas dependencias.

## R2. Esquema SQLite e identidad de las tareas

- **Decision**: Tabla única `tasks` con `id INTEGER PRIMARY KEY
  AUTOINCREMENT`, `CHECK` constraints para `priority`
  (`high|medium|low`) y `status` (`todo|in-progress|done`), y
  `title TEXT NOT NULL`. `CREATE TABLE IF NOT EXISTS` en la primera
  ejecución, con `PRAGMA journal_mode=WAL` y `PRAGMA foreign_keys=ON`.
- **Rationale**: `AUTOINCREMENT` garantiza que los IDs nunca se reutilizan
  tras un borrado (un ID borrado no puede reaparecer apuntando a otra
  tarea). Los `CHECK` refuerzan en la base lo que FR-004/FR-006 validan en
  código, sin depend de la aplicación. WAL es el modo recomendado de
  `better-sqlite3` para concurrencia lectura/escritura.
- **Alternativas consideradas**: (a) `INTEGER PRIMARY KEY` simple (rowid)
  — más rápido pero permite reutilizar el máximo ID tras borrar;
  (b) UUIDs — viola el spec (ID numérico autoincremental, FR-002);
  (c) ORM (Drizzle/Prisma/knex) — prohibido por los principios II y VIII.

## R3. Fecha de creación: almacenamiento y formato

- **Decision**: Guardar `created_at` como TEXT ISO-8601 con zona UTC
  (`new Date().toISOString()`, p. ej. `2026-10-01T14:23:05.123Z`). El
  listado muestra el valor ISO recortado a segundos
  (`2026-10-01 14:23:05 UTC`). Orden por `created_at DESC`; desempate por
  `id DESC` para tareas creadas en el mismo milisegundo.
- **Rationale**: TEXT ISO-8601 ordena lexicográficamente igual que
  cronológicamente, es legible en tabla y no requiere conversión de tipos.
  El spec solo pide "fecha de creación" (Key Entities) y orden
  "más recientes primero" (FR-005).
- **Alternativas consideradas**: (a) epoch ms INTEGER — ordena bien pero
  requiere formatear siempre para mostrar; (b) fecha local sin offset —
  ambigua y ordena mal entre sesiones; (c) `datetime('now')` de SQLite —
  texto no normalizado en precisión.

## R4. Máquina de transiciones de estado

- **Decision**: Mapa inmutable en `utils/` (función pura
  `canTransition(from, to): boolean` apoyada en
  `Record<Status, Status[]>`):
  `todo → [in-progress]`, `in-progress → [done, todo]`,
  `done → [todo]`. Toda transición no listada (incluida la identidad
  `X → X`) se rechaza con `CliError` → mensaje en español + exit 1
  (FR-007).
- **Rationale**: El spec enumera explícitamente las 4 válidas (FR-006);
  cualquier otra, incluido repetir el mismo estado, queda fuera de la
  lista y por tanto inválida. Mapa + función pura es trivialmente testeable
  con Vitest (principio VII) y cumple estilo funcional (principio IV).
- **Alternativas consideradas**: (a) `switch` repartido en el comando —
  difícil de testear aislado; (b) permitir `X → X` como no-op — no está en
  la lista del spec, añade caso no pedido; (c) tabla de transiciones en
  BD — sobrediseño para 3 estados.

## R5. Confirmación de borrado e interactividad

- **Decision**: `utils/prompts.ts` con `node:readline`. Flujo: si
  `--force` → eliminar directo; si `process.stdin.isTTY` es `false` (o
  `process.stdout.isTTY` es `false`) → `CliError` "usa --force…" exit 1
  (FR-009); si es interactivo → `¿Eliminar la tarea {id} "{título}"? (s/N) `
  con respuesta por defecto **No** (cualquier cosa distinta de `s`/`S`/
  `si`/`sí` cancela → "Eliminación cancelada.", la tarea queda intacta,
  exit 0).
- **Rationale**: Es el patrón seguro de CLIs: sin TTY jamás se bloquea ni
  borra sin explícito `--force`; el default `N` protege ante Enter
  accidental. `readline` es nativo (principio VIII). Exit 0 en cancelación
  porque es una decisión del usuario, no un error (spec: cancelar deja la
  tarea sin cambios).
- **Alternativas consideradas**: (a) librerías (`inquirer`, `prompts`) —
  dependencia extra para una pregunta; (b) tratar no-TTY como "sí" —
  borrado silencioso, inaceptable; (c) tratar no-TTY como cancelación
  exit 0 — enmascara errores de uso en scripts; el spec/clarificación
  pidió exit 1.

## R6. Salida: tablas, colores y streams

- **Decision**: `list` imprime tabla con `cli-table3`, cabeceras en
  español: `ID | Título | Estado | Prioridad | Creada`. Colores ANSI
  inline (funciones tiny en `utils/output.ts`): estado `todo`=amarillo,
  `in-progress`=cian, `done`=verde; prioridad `high`=rojo, `medium`=
  amarillo, `low`=verde — **solo** esas dos columnas (principio IX).
  Éxitos por stdout; errores por stderr. Lista vacía sin filtros →
  `No hay tareas.`; con filtros sin coincidencias → `No hay tareas que
  coincidan con el filtro.` (ambos sin tabla, exit 0 — clarificación Q4).
- **Rationale**: `cli-table3` es la opción citada por la constitución;
  escapes ANSI directos evitan dependencias como `chalk`; separar stdout/
  stderr es el estándar para que `| grep`, redirecciones y scripts
  funcionen. Mensajes exactos en [contracts/commands.md](./contracts/commands.md).
- **Alternativas consideradas**: (a) `chalk`/`picocolors` — librería para
  algo resoluble en pocas líneas (principio VIII); (b) tabla sin colores —
  incumple "colores solo para estados y prioridades" (los exige); (c)
  todo por stdout — rompe el uso en pipelines.

## R7. Manejo global de errores

- **Decision**: `utils/errors.ts` exporta `CliError extends Error` con
  `exitCode` (1 por defecto) y mensaje ya redactado en español. Los
  comandos lanzan `CliError`; `index.ts` envuelve el despacho en un
  try/catch único que imprime `Error: {mensaje}` por stderr y hace
  `process.exit(1)`. Nunca se imprime `error.stack`. Errores
  inesperados → mensaje genérico `Error inesperado: contacta con el
  desarrollador.` (sin stack) + exit 1.
- **Rationale**: Concentra el contrato 0/1 (FR-011, principio VI) en un
  solo punto; los comandos quedan libres de boilerplate y son funciones
  puras/semi-puras testeables. El catch global es la red de seguridad que
  garantiza SC-005 (ningún stack trace).
- **Alternativas consideradas**: (a) `process.exit` en cada comando —
  acoplamiento, difícil de testear; (b) manejo de errores por código de
  retorno — no sirve para distinguir mensajes; (c) librerías de errores —
  innecesarias.

## R8. Localización de mensajes (español) y Commander.js

- **Decision**: Todos los textos del usuario en español (FR-013):
  descripciones de comandos/flags en español (afectan `--help`), mensajes
  de `CliError` en español, cabeceras de tabla en español. Errores de
  parseo de Commander se traducen capturando sus excepciones con
  `program.exitOverride()` + `program.configureOutput({ outputError })` y
  remapeando las situaciones comunes (unknown command, unknown option,
  missing argument, invalid argument) a mensajes propios en español con
  exit 1.
- **Rationale**: Commander escribe sus built-ins en inglés por defecto; sin
  override, un usuario que escribe mal un flag vería un mensaje en inglés,
  violando FR-013 y el requisito de mensajes claros/accionables.
  `exitOverride`/`configureOutput` es la API soportada para esto.
- **Alternativas consideradas**: (a) dejar los mensajes de Commander en
  inglés — viola FR-013; (b) framework CLI alternativo — prohibido
  (principio V); (c) no usar `command()` de Commander y parsear a mano —
  reinvención.

## R9. Aislamiento de la base de datos en pruebas

- **Decision**: `db/connection.ts` resuelve la ruta con
  `path.join(os.homedir(), '.task-cli', 'tasks.db')` y crea el directorio
  con `fs.mkdirSync(dir, { recursive: true })` si no existe. Las pruebas
  de integración ejecutan el CLI como subproceso con `HOME` y
  `USERPROFILE` apuntando a un directorio temporal por test, aislando por
  completo la BD del usuario real. Sin variables de entorno especiales en
  producción.
- **Rationale**: `os.homedir()` honra `HOME` (POSIX) y `USERPROFILE`
  (Windows), así el mismo mecanismo funciona en las tres plataformas
  objetivo. No se introduce un seam de producción solo para tests, y la
  ruta canónica `~/.task-cli/tasks.db` del principio II se mantiene
  intacta.
- **Alternativas consideradas**: (a) variable `TASK_CLI_DB` de
  producción — añade superficie no pedida; (b) tests sobre el `tasks.db`
  real — destruye datos del usuario; (c) mockear `better-sqlite3` en
  integración — no valida el SQL real.

## R10. Estrategia de pruebas

- **Decision**: Vitest (principio VII). Unitarias (fun puras, sin I/O):
  `canTransition` (matriz completa 3×3), validación de `create`/`update`
  (título vacío, prioridad inválida), filtrado y orden (combinación
  `--status` + `--priority`, orden `created_at DESC, id DESC`), formato de
  fechas, mensajes de `CliError`. Integración: spawn de `node dist/index.js`
  (o `tsx src/index.ts`) con HOME temporal, verificando stdout/stderr y
  códigos de salida 0/1 contra los escenarios de
  [quickstart.md](./quickstart.md) y el contrato de
  [contracts/commands.md](./contracts/commands.md). Sin cobertura mínima
  (principio VII), pero toda lógica de negocio cubierta.
- **Rationale**: La matriz de transiciones y las reglas de filtrado son
  donde vive el 100% del riesgo funcional (SC-002); los tests de proceso
  real validan exit codes, streams y textos en español de extremo a
  extremo, que es lo que exigen los criterios de aceptación.
- **Alternativas consideradas**: (a) solo unitarias — no cubre exit
  codes ni salida real; (b) solo E2E — lentas y frágiles para lógica
  pura; (c) cobertura obligatoria — prohibida por el principio VII.

## Resolución de NEEDS CLARIFICATION

Ninguno: Technical Context se completó íntegramente con la constitución y
el spec clarificado. Las decisiones R1–R10 cierran los puntos abiertos
diferidos en `/speckit.clarify` (reutilización de IDs → R2; límites de
título → data-model.md V3; semántica de filtros combinados → data-model.md
V5; `updated_at` → fuera de alcance, no lo pide el spec).

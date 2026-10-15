# Quickstart Validation: task-cli

**Branch**: `001-task-cli` | **Date**: 2026-10-01

**Input**: [plan.md](./plan.md), [contracts/commands.md](./contracts/commands.md),
[data-model.md](./data-model.md)

Guía de validación extremo a extremo. Los mensajes y códigos de salida
exactos están en el [contrato de comandos](./contracts/commands.md); aquí
solo se referencian.

## Prerrequisitos

- Node.js LTS (22.x) y npm instalados (`node -v`).
- Acceso de escritura en el directorio del usuario (`~/.task-cli/`).

## Setup

```bash
npm install          # dependencias
npm test             # Vitest: unitarios + integración (debe pasar, puerta de calidad)
npm run build        # tsc → dist/ (debe compilar sin errores)
```

Ejecución sin instalar (desarrollo): `npm run dev -- <comandos>`
(usa `tsx`, research.md R1).

Instalación global para validar el binario:

```bash
npm install -g .     # instala el paquete actual
task-cli --help      # debe mostrar ayuda en español, exit 0
```

> Aislamiento: para no tocar `~/.task-cli/tasks.db` real, los escenarios
> manuales pueden apuntar el HOME a un directorio temporal
> (`HOME=/tmp/task-cli-test USERPROFILE=/tmp/task-cli-test` en la misma
> sesión — research.md R9).

## Escenarios de validación

Cada escenario indica comando, resultado esperado y código de salida.
Verificar también que **ninguna** salida contiene stack traces (SC-005).

### 1. Crear tareas (US1 / FR-001, FR-002)

```bash
task-cli create "Comprar leche"                       # exit 0 → "Tarea 1 creada: …" (medium, todo)
task-cli create "Pagar factura" --priority high --description "Antes del viernes"   # exit 0 → ID 2
task-cli create "Comprar leche"                       # exit 0 → ID 3 (autoincremental, títulos pueden repetirse)
task-cli create ""                                    # exit 1 → "Error: el título no puede estar vacío."
task-cli create                                       # exit 1 → falta argumento obligatorio, Uso: …
task-cli create "x" --priority urgent                 # exit 1 → prioridad inválida + valores válidos
```

### 2. Listar y filtrar (US2 / FR-003…FR-005)

```bash
task-cli list                                         # exit 0 → tabla con TODAS las tareas (incl. done), más recientes primero
task-cli list --status done                           # exit 0 → solo done
task-cli list --priority high                         # exit 0 → solo high
task-cli list --status done --priority high           # exit 0 → intersección AND
task-cli list --status bogus                          # exit 1 → valor inválido + valores válidos
```

Verificar cabeceras de tabla en español (`ID, Título, Estado, Prioridad,
Creada`) y colores solo en Estado/Prioridad (research.md R6).

### 3. Estado vacío (clarificación Q4)

Con la base vacía (HOME temporal recién creado):

```bash
task-cli list                                         # exit 0 → "No hay tareas." (sin tabla)
task-cli list --status done                           # exit 0 → "No hay tareas que coincidan con el filtro." (sin tabla)
```

### 4. Transiciones de estado (US3 / FR-006, FR-007, SC-002)

```bash
task-cli status 1 in-progress                         # exit 0 → "Tarea 1: todo → in-progress"
task-cli status 1 done                                # exit 0 → "Tarea 1: in-progress → done"
task-cli status 1 todo                                # exit 0 → "Tarea 1: done → todo"
task-cli status 1 done                                # exit 1 (estando en todo) → transición inválida + válidas desde "todo"
task-cli status 99 in-progress                        # exit 1 → "no existe la tarea con ID 99"
task-cli status 1 flying                              # exit 1 → estado inválido + valores válidos
```

La matriz completa (3×3) está en [data-model.md](../data-model.md) y se
cubre con la unit test `canTransition`.

### 5. Ver detalle (US6 / FR-014)

```bash
task-cli show 2                                       # exit 0 → todas las filas, incl. Descripción "Antes del viernes"
task-cli show 99                                      # exit 1 → no existe la tarea con ID 99
```

### 6. Actualizar (US4 / FR-008)

```bash
task-cli update 1 --title "Comprar leche y pan" --priority low   # exit 0 → "Tarea 1 actualizada."
task-cli update 1 --description "nueva"               # exit 0 → descripción visible vía `show 1`
task-cli update 1                                     # exit 1 → exige al menos un campo
task-cli update 99 --title "x"                        # exit 1 → no existe la tarea con ID 99
task-cli list --status done                           # estado NO cambió por update (V7)
```

### 7. Eliminar (US5 / FR-009)

```bash
task-cli delete 3 --force                             # exit 0 → "Tarea 3 eliminada."
task-cli delete 99 --force                            # exit 1 → no existe la tarea con ID 99
printf 'n\n' | task-cli delete 2                      # exit 1 → stdin NO es TTY → sugiere --force, tarea intacta (FR-009)
task-cli delete 2 </dev/null                          # exit 1 → idem
```

Cancelación interactiva (manual, requiere TTY): ejecutar
`task-cli delete 2`, responder `n` o Enter →
`Eliminación cancelada.` exit 0, la tarea sigue en `list`.
Confirmación con `s` → `Tarea 2 eliminada.` exit 0.

### 8. Persistencia entre ejecuciones (FR-010)

```bash
task-cli create "Persistir"                           # exit 0 → ID n
# cerrar y reabrir la terminal (nueva ejecución):
task-cli list                                         # exit 0 → la tarea "Persistir" sigue presente
```

### 9. Ayuda y errores de parseo (research.md R8)

```bash
task-cli --help                                       # exit 0 → textos en español
task-cli crate "x"                                    # exit 1 → comando desconocido en español + comandos disponibles
task-cli list --bogus                                 # exit 1 → opción desconocida en español
```

### 10. Puerta de calidad (constitución)

```bash
npm test             # Vitest en verde (unit + integración)
npm run build        # tsc sin errores
npm install -g .     # instalación global
task-cli --version   # exit 0
```

## Criterio de validación global

El feature se considera válido cuando: los 10 escenarios anteriores
producen los resultados y códigos del contrato; `npm test` y
`npm run build` pasan; ningún mensaje contiene stack traces; y las
salidas de usuario están en español (FR-013).

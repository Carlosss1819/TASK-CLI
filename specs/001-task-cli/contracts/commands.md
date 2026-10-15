# Contract: task-cli (comandos)

**Branch**: `001-task-cli` | **Date**: 2026-10-01

**Input**: [spec.md](../spec.md), [data-model.md](../data-model.md)

Contrato de interfaces del CLI: qué comandos expone, sintaxis, salida y
códigos de retorno. Es la referencia canónica que implementación y tests
deben cumplir literalmente (mensajes exactos en español — FR-013).

## Convenciones globales

| Aspecto | Regla |
|---------|-------|
| Binario | `task-cli` (npm global, research.md R1) |
| Éxito | salida por **stdout**, código de salida **0** |
| Error | mensaje por **stderr** empezando por `Error: `, código de salida **1** |
| Idioma | toda salida del usuario en español (FR-013); `--help` en español |
| Stack traces | prohibidos: jamás se imprime `error.stack` (FR-011, SC-005) |
| Valores de flag | `--status todo\|in-progress\|done`; `--priority high\|medium\|low` |

---

## `create` — crear tarea (FR-001, FR-002)

**Sintaxis**: `task-cli create <título> [--priority <prioridad>] [--description <texto>]`

| Elemento | Regla |
|----------|-------|
| `<título>` | obligatorio, no vacío tras trim (V1) |
| `--priority` | opcional, default `medium` (V3) |
| `--description` | opcional, default `NULL` (V2) |

**Éxito (exit 0)**, stdout:

```text
Tarea 1 creada: "Comprar leche" (prioridad: medium, estado: todo)
```

**Errores (exit 1)**:

| Situación | Mensaje (stderr) |
|-----------|------------------|
| Sin `<título>` | `Error: falta el argumento obligatorio <título>. Uso: task-cli create <título> [--priority high\|medium\|low] [--description <texto>]` |
| Título vacío/espacios | `Error: el título no puede estar vacío.` |
| Prioridad inválida | `Error: prioridad inválida "X". Valores válidos: high, medium, low.` |

---

## `list` — listar tareas (FR-003, FR-004, FR-005)

**Sintaxis**: `task-cli list [--status <estado>] [--priority <prioridad>]`

| Elemento | Regla |
|----------|-------|
| Sin filtros | muestra **todas** las tareas, incluidas las `done` (FR-003) |
| `--status` + `--priority` | intersección AND (V5) |
| Orden | `created_at DESC, id DESC` (V6) |

**Éxito (exit 0)** — stdout, tabla con `cli-table3`, cabeceras en español:

```text
┌────┬─────────────────┬─────────────┬────────────┬─────────────────────┐
│ ID │ Título          │ Estado      │ Prioridad  │ Creada              │
├────┼─────────────────┼─────────────┼────────────┼─────────────────────┤
│ 2  │ Pagar factura   │ in-progress │ high       │ 2026-10-01 14:23:05 │
│ 1  │ Comprar leche   │ todo        │ medium     │ 2026-10-01 09:10:00 │
└────┴─────────────────┴─────────────┴────────────┴─────────────────────┘
```

Colores ANSI **solo** en columnas Estado y Prioridad (research.md R6).

**Sin resultados (exit 0, sin tabla, stdout)**:

- Sin tareas en absoluto: `No hay tareas.`
- Con filtros sin coincidencias: `No hay tareas que coincidan con el filtro.`

**Errores (exit 1)**:

| Situación | Mensaje (stderr) |
|-----------|------------------|
| `--status` inválido | `Error: valor inválido para --status "X". Valores válidos: todo, in-progress, done.` |
| `--priority` inválido | `Error: valor inválido para --priority "X". Valores válidos: high, medium, low.` |

---

## `show` — ver detalle (FR-014)

**Sintaxis**: `task-cli show <id>`

**Éxito (exit 0)** — stdout, todas las filas de la tarea:

```text
ID:         1
Título:     Comprar leche
Descripción: Ir al supermercado por la tarde
Estado:     todo
Prioridad:  medium
Creada:     2026-10-01 09:10:00
```

**Errores (exit 1)**:

| Situación | Mensaje (stderr) |
|-----------|------------------|
| ID inexistente | `Error: no existe la tarea con ID 5.` |
| ID no numérico | `Error: el ID debe ser un número entero positivo. Recibido: "abc".` |

---

## `status` — cambiar estado (FR-006, FR-007)

**Sintaxis**: `task-cli status <id> <nuevo-estado>`

`<nuevo-estado>` ∈ `todo | in-progress | done`. Transiciones según la
matriz de [data-model.md](../data-model.md); solo las 4 válidas.

**Éxito (exit 0)** — stdout:

```text
Tarea 1: todo → in-progress
```

**Errores (exit 1)**:

| Situación | Mensaje (stderr) |
|-----------|------------------|
| Transición inválida | `Error: no se puede cambiar la tarea 1 de "todo" a "done". Transiciones válidas desde "todo": in-progress.` |
| ID inexistente | `Error: no existe la tarea con ID 5.` |
| Estado desconocido | `Error: estado inválido "X". Valores válidos: todo, in-progress, done.` |

---

## `update` — actualizar campos (FR-008)

**Sintaxis**: `task-cli update <id> [--title <título>] [--description <texto>] [--priority <prioridad>]`

Actualiza solo los campos indicados; **nunca** el `status` (V7). Al menos
un flag de campo obligatorio.

**Éxito (exit 0)** — stdout:

```text
Tarea 1 actualizada.
```

**Errores (exit 1)**:

| Situación | Mensaje (stderr) |
|-----------|------------------|
| Sin ningún flag de campo | `Error: indica al menos un campo a actualizar: --title, --description o --priority.` |
| ID inexistente | `Error: no existe la tarea con ID 5.` |
| Título vacío | `Error: el título no puede estar vacío.` |
| Prioridad inválida | `Error: prioridad inválida "X". Valores válidos: high, medium, low.` |

---

## `delete` — eliminar tarea (FR-009)

**Sintaxis**: `task-cli delete <id> [--force]`

**Flujo** (research.md R5):

1. `--force` → elimina directamente.
2. Sin `--force` y **entrada interactiva** → prompt en stdin/stdout:
   `¿Eliminar la tarea 1 "Comprar leche"? (s/N) ` — `s`/`S`/`si`/`sí`
   (mayúsculas/minúsculas indistintas) confirma; cualquier otra respuesta
   o Enter cancela.
3. Sin `--force` y **entrada no interactiva** (script, CI, stdin
   redirigido) → error, sin eliminar (FR-009).

**Éxito (exit 0)** — stdout:

- Tras confirmar o con `--force`: `Tarea 1 eliminada.`
- Al cancelar: `Eliminación cancelada.` (la tarea permanece intacta)

**Errores (exit 1)**:

| Situación | Mensaje (stderr) |
|-----------|------------------|
| No interactiva sin `--force` | `Error: la entrada no es interactiva; usa --force para eliminar sin confirmación.` |
| ID inexistente | `Error: no existe la tarea con ID 5.` |
| ID no numérico | `Error: el ID debe ser un número entero positivo. Recibido: "abc".` |

---

## Ayuda y parseo (`--help`, flags desconocidos)

- `task-cli --help` y `task-cli <comando> --help`: textos en español
  (descripciones de comandos y flags redactadas en español).
- Flag desconocido, comando desconocido o argumento faltante → mensaje en
  español (remapeo de Commander, research.md R8), stderr, exit 1.

Ejemplo:

```text
Error: comando desconocido "crate". Comandos disponibles: create, list, show, status, update, delete.
```

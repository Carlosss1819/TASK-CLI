# Data Model: task-cli

**Branch**: `001-task-cli` | **Date**: 2026-10-01

**Input**: [spec.md](./spec.md) (Key Entities, FR-001…FR-014),
[research.md](./research.md) (R2, R3, R4)

## Entidad: Tarea

Representa una unidad de trabajo personal (spec → Key Entities). Una sola
entidad, sin relaciones: el feature no tiene asociaciones ni jerarquías
(usuarios, subtareas y dependencias están fuera de alcance).

### Tabla `tasks`

| Campo | Tipo | Restricción | Origen |
|-------|------|-------------|--------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT (nunca reutiliza IDs) | FR-002 |
| `title` | TEXT | NOT NULL, sin trim → no vacío (ver V1) | FR-001 |
| `description` | TEXT | NULL permitido (opcional) | FR-001 |
| `priority` | TEXT | NOT NULL, DEFAULT `'medium'`, CHECK en `('high','medium','low')` | FR-001 |
| `status` | TEXT | NOT NULL, DEFAULT `'todo'`, CHECK en `('todo','in-progress','done')` | FR-002 |
| `created_at` | TEXT | NOT NULL, ISO-8601 UTC (`toISOString()`) | FR-003, Assumptions |

No existe `updated_at`: el spec no lo declara en Key Entities ni en
requisitos; actualizar (FR-008) no modifica `created_at`.

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  description TEXT,
  priority    TEXT    NOT NULL DEFAULT 'medium'
              CHECK (priority IN ('high','medium','low')),
  status      TEXT    NOT NULL DEFAULT 'todo'
              CHECK (status IN ('todo','in-progress','done')),
  created_at  TEXT    NOT NULL
);
```

Base en `~/.task-cli/tasks.db`; se crea el directorio y la tabla en la
primer ejecución (research.md R2, R9).

## Reglas de validación

- **V1 — Título**: obligatorio; tras `trim()` no puede quedar vacío
  (`create` siempre; `update --title` si se proporciona). Sin longitud
  máxima: el spec no define límite y añadirlo rechazaría entradas no
  documentadas. Aplica FR-001, FR-008.
- **V2 — Descripción**: opcional; cadena libre (puede ser vacía).
  Aplica FR-001, FR-008.
- **V3 — Prioridad**: solo `high|medium|low`; default `medium` si se omite
  en `create`. Valor inválido → `CliError`, exit 1. Aplica FR-001.
- **V4 — ID**: entero positivo; inexistente → `CliError`, exit 1
  (spec → Edge Cases; FR-014).
- **V5 — Filtros del listado**: `--status` ∈ `todo|in-progress|done`,
  `--priority` ∈ `high|medium|low`; valor inválido → mensaje con valores
  válidos, exit 1. Ambos flags combinados = intersección (AND).
  Aplica FR-004.
- **V6 — Orden del listado**: `created_at DESC, id DESC` (desempate para
  la misma milisegundo). Aplica FR-005.
- **V7 — Actualización**: `update` exige al menos uno de
  `--title|--description|--priority`; sin ninguno → `CliError`, exit 1.
  El `status` NO se modifica por `update` (para eso está `status`).
  Aplica FR-008.

## Transiciones de estado

Conjunto de estados: `todo`, `in-progress`, `done` (FR-002, FR-006).

| Desde \ Hacia | todo | in-progress | done |
|---------------|------|-------------|------|
| **todo** | ✗ inválida | ✓ válida | ✗ inválida (FR-007) |
| **in-progress** | ✓ válida | ✗ inválida | ✓ válida |
| **done** | ✓ válida | ✗ inválida | ✗ inválida |

Matriz completa implementada como función pura `canTransition(from, to)`
(R4). Toda celda ✗ → mensaje en español con la transición rechazada y
exit 1 (FR-007, SC-002). La auto-transición `X → X` no figura entre las
4 válidas del spec → inválida.

Transiciones válidas (las únicas 4 del spec):

```text
✓  todo         → in-progress
✓  in-progress → done
✓  in-progress → todo
✓  done        → todo
✗  cualquier otra combinación (incl. todo → done y X → X)
   → rechazada con mensaje en español y exit 1
```

## Volumen y rendimiento

- Escala objetivo: ≤ 1.000 tareas por usuario (SC-003); una sola tabla
  con PK basta, sin índices adicionales (research.md R2).
- Todas las consultas de listado son un `SELECT` con filtros opcionales y
  `ORDER BY`; objetivo < 1 s a 1.000 filas — holgado en SQLite local.

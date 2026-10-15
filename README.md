# task-cli

CLI personal de gestión de tareas desde la terminal, con persistencia local
en SQLite (`~/.task-cli/tasks.db`). Toda la salida del CLI está en español.

## Requisitos

- Node.js LTS (22.x o superior) y npm.

## Instalación

```bash
npm install -g .
```

Tras la instalación global está disponible el binario `task-cli`:

```bash
task-cli --help     # ayuda en español
task-cli --version  # número de versión
```

En desarrollo, sin instalar:

```bash
npm install         # dependencias
npm run dev -- <comandos>   # ejecución directa con tsx
npm test            # Vitest: unitarios + integración
npm run build       # tsc → dist/
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `task-cli create <título> [--priority <prioridad>] [--description <texto>]` | Crear una tarea (título obligatorio; prioridad `high\|medium\|low`, por defecto `medium`) |
| `task-cli list [--status <estado>] [--priority <prioridad>]` | Listar tareas en tabla, ordenadas de más recientes a más antiguas |
| `task-cli show <id>` | Ver el detalle completo de una tarea, incluida la descripción |
| `task-cli status <id> <nuevo-estado>` | Cambiar el estado (`todo`, `in-progress`, `done`) |
| `task-cli update <id> [--title <título>] [--description <texto>] [--priority <prioridad>]` | Actualizar campos de una tarea (nunca el estado) |
| `task-cli delete <id> [--force]` | Eliminar una tarea (pide confirmación salvo con `--force`) |

## Ejemplos

```bash
# Crear tareas
task-cli create "Comprar leche"
task-cli create "Pagar factura" --priority high --description "Antes del viernes"

# Listar y filtrar
task-cli list
task-cli list --status done
task-cli list --priority high --status in-progress   # filtros combinados (AND)

# Ver detalle
task-cli show 2

# Flujo de estados: todo → in-progress → done (y retrocesos a todo)
task-cli status 1 in-progress
task-cli status 1 done
task-cli status 1 todo

# Actualizar
task-cli update 1 --title "Comprar leche y pan" --priority low

# Eliminar
task-cli delete 3 --force          # sin confirmación
task-cli delete 2                  # pide confirmación (solo en terminal interactiva)
```

## Estados y transiciones

Estados: `todo`, `in-progress`, `done`. Transiciones válidas:

```text
✓  todo         → in-progress
✓  in-progress → done
✓  in-progress → todo
✓  done        → todo
✗  cualquier otra (incluida X → X y todo → directo a done)
```

Las transiciones inválidas se rechazan con mensaje en español y código de
salida 1.

## Códigos de salida

- `0` — éxito (incluida la cancelación de un borrado).
- `1` — error (mensaje por stderr empezando por `Error: `, sin stack traces).

## Datos

La base de datos se crea en el primer uso en `~/.task-cli/tasks.db`
(SQLite con WAL). Los IDs son autoincrementales y nunca se reutilizan.

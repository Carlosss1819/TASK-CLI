# Feature Specification: task-cli

**Feature Branch**: `001-task-cli`

**Created**: 2026-10-01

**Status**: Draft

**Input**: User description: "Construir un CLI llamado \"task-cli\" para gestión de tareas personales desde la terminal."

## Clarifications

### Session 2026-10-01

- Q: In which language should the CLI display its user-facing messages (errors, confirmations, table headers)? → A: Spanish (errors, confirmations, and table headers in Spanish).
- Q: How can a user read the description of a task, given that the list table doesn't include it? → A: Add a `show <id>` command that prints all fields of one task, including description.
- Q: Does the default list (with no filters) show all tasks including those with status "done"? → A: Yes — default shows every task (todo, in-progress, done); "activas" means all stored tasks.
- Q: When the list has no tasks to show (empty list or a filter matching nothing), what should the CLI display? → A: A plain message like "No hay tareas que coincidan con el filtro." (no table drawn).
- Q: What should `delete` do when it runs without an interactive terminal (scripts, CI, piped stdin) and `--force` was not passed? → A: Abort with a clear error ("Use --force para eliminar sin confirmación"), code 1, task unchanged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear tareas (Priority: P1)

El usuario crea una tarea con un título obligatorio, prioridad opcional
(high/medium/low, default medium) y descripción opcional. Cada tarea recibe
un ID numérico autoincremental y estado inicial "todo".

**Why this priority**: Sin creación de tareas no existe gestión alguna.

**Independent Test**: Ejecutar el comando de creación y verificar que la tarea
aparece listada con ID, estado "todo" y prioridad indicada o por defecto.

**Acceptance Scenarios**:

1. **Given** no hay tareas, **When** el usuario crea una tarea con título
   "Comprar leche", **Then** se crea con ID 1, estado "todo", prioridad
   "medium".
2. **Given** existe una tarea, **When** el usuario crea otra con título y
   prioridad "high", **Then** recibe el siguiente ID autoincremental.
3. **Given** el usuario ejecuta la creación sin título, **When** falta el
   argumento obligatorio, **Then** el CLI muestra un mensaje de error claro y
   código de salida 1.

---

### User Story 2 - Listar tareas (Priority: P1)

El usuario lista sus tareas en formato tabla mostrando ID, título, estado,
prioridad y fecha de creación. Puede filtrar por estado y prioridad, y por
defecto se ordenan de más recientes a más antiguas.

**Why this priority**: Es la forma principal de consultar el estado del trabajo.

**Independent Test**: Con varias tareas creadas, ejecutar el listado y
verificar formato de tabla, filtros y orden.

**Acceptance Scenarios**:

1. **Given** varias tareas existen, **When** el usuario lista sin filtros,
   **Then** se muestran en tabla ordenadas de más recientes a más antiguas.
2. **Given** varias tareas con distintos estados, **When** el usuario filtra
   con `--status done`, **Then** solo se muestran las tareas con ese estado.
3. **Given** varias tareas con distintas prioridades, **When** el usuario
   filtra con `--priority high`, **Then** solo se muestran las de prioridad
   alta.

---

### User Story 3 - Cambiar estado de una tarea (Priority: P1)

El usuario cambia el estado de una tarea por su ID, respetando las
transiciones válidas: todo → in-progress, in-progress → done,
in-progress → todo, done → todo. Las transiciones inválidas (p. ej.
todo → done) se rechazan con mensaje de error.

**Why this priority**: Es el flujo central de seguimiento del trabajo.

**Independent Test**: Crear una tarea y recorrer las transiciones válidas e
inválidas verificando mensajes y código de salida.

**Acceptance Scenarios**:

1. **Given** una tarea en "todo", **When** el usuario la pasa a
   "in-progress", **Then** el estado cambia correctamente.
2. **Given** una tarea en "in-progress", **When** el usuario la completa,
   **Then** el estado pasa a "done".
3. **Given** una tarea en "todo", **When** el usuario intenta marcarla como
   "done", **Then** el CLI rechaza la transición con mensaje claro y código
   de salida 1.
4. **Given** una tarea en "done", **When** el usuario la reabre, **Then**
   vuelve a "todo".

---

### User Story 4 - Actualizar una tarea (Priority: P2)

El usuario modifica el título, descripción o prioridad de una tarea existente
mediante su ID.

**Why this priority**: Necesario para corregir o ajustar tareas creadas.

**Independent Test**: Crear una tarea, actualizar campos y verificar los
cambios en el listado.

**Acceptance Scenarios**:

1. **Given** una tarea existente, **When** el usuario actualiza su título y
   prioridad, **Then** los nuevos valores se reflejan al listar.
2. **Given** un ID inexistente, **When** el usuario intenta actualizar,
   **Then** el CLI muestra un error claro y código de salida 1.

---

### User Story 5 - Eliminar una tarea (Priority: P2)

El usuario elimina una tarea por su ID, con confirmación previa salvo que use
`--force`.

**Why this priority**: Complementa la gestión manteniendo la lista limpia.

**Independent Test**: Eliminar con y sin confirmación y sin `--force`
verificando el comportamiento.

**Acceptance Scenarios**:

1. **Given** una tarea existente, **When** el usuario la elimina confirmando,
   **Then** la tarea ya no aparece en el listado.
2. **Given** una tarea existente, **When** el usuario la elimina con
   `--force`, **Then** se elimina sin pedir confirmación.
3. **Given** una tarea existente, **When** el usuario cancela la confirmación,
   **Then** la tarea permanece sin cambios.

---

### User Story 6 - Ver detalle de una tarea (Priority: P2)

El usuario consulta el detalle completo de una tarea por su ID, incluida la
descripción, que no se muestra en el listado.

**Why this priority**: Sin este comando la descripción creada no puede leerse.

**Independent Test**: Crear una tarea con descripción, ejecutar `show <id>` y
verificar que aparecen todos los campos; repetir con un ID inexistente.

**Acceptance Scenarios**:

1. **Given** una tarea con descripción existe, **When** el usuario ejecuta
   `show <id>`, **Then** se muestran todos los campos de la tarea, incluida la
   descripción.
2. **Given** un ID inexistente, **When** el usuario ejecuta `show <id>`,
   **Then** el CLI muestra un error claro y código de salida 1.

### Edge Cases

- ¿Qué ocurre cuando se usa un ID que no existe? → Error claro, código 1.
- ¿Qué ocurre cuando se filtran tareas y no hay coincidencias (o la lista
  está vacía)? → Se muestra un mensaje claro en español (p. ej. "No hay
  tareas que coincidan con el filtro.") sin dibujar tabla y con código de
  salida 0.
- ¿Qué ocurre con un estado o prioridad inválido en filtros? → Mensaje de
  error con valores válidos, código 1.
- ¿Qué ocurre al eliminar con un ID inexistente? → Error claro, código 1.
- ¿Qué ocurre al eliminar sin `--force` en un contexto no interactivo
  (script, CI, stdin redirigido)? → Se aborta con mensaje "Use --force para
  eliminar sin confirmación", código de salida 1, la tarea no se elimina.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir crear tareas con título obligatorio,
  prioridad opcional (high/medium/low, default medium) y descripción opcional.
- **FR-002**: El sistema MUST asignar a cada tarea un ID numérico
  autoincremental y estado inicial "todo".
- **FR-003**: El sistema MUST listar tareas en formato tabla con ID, título,
  estado, prioridad y fecha de creación; sin filtros se muestran todas las
  tareas almacenadas, incluidas las de estado "done".
- **FR-004**: El sistema MUST permitir filtrar el listado por estado
  (`--status todo|in-progress|done`) y por prioridad
  (`--priority high|medium|low`).
- **FR-005**: El sistema MUST ordenar el listado por fecha de creación, más
  recientes primero por defecto.
- **FR-006**: El sistema MUST permitir cambiar el estado de una tarea por ID,
  aceptando solo las transiciones válidas: todo → in-progress,
  in-progress → done, in-progress → todo, done → todo.
- **FR-007**: El sistema MUST rechazar transiciones inválidas (p. ej.
  todo → done) con mensaje claro y código de salida 1.
- **FR-008**: El sistema MUST permitir actualizar título, descripción o
  prioridad de una tarea existente por ID.
- **FR-009**: El sistema MUST pedir confirmación antes de eliminar una tarea,
  salvo con `--force`. Si la entrada no es interactiva y no se usa `--force`,
  el sistema MUST abortar con mensaje que sugiera usar `--force`, código de
  salida 1 y sin eliminar la tarea.
- **FR-010**: El sistema MUST persistir las tareas de forma local entre
  ejecuciones.
- **FR-011**: El sistema MUST mostrar mensajes de error claros y accionables
  sin stack traces, con código de salida 1 ante errores y 0 ante éxito.
- **FR-012**: El sistema MUST ser instalable globalmente via `npm install -g`.
- **FR-013**: Toda la salida del CLI dirigida al usuario (mensajes de error,
  confirmaciones, cabeceras de tabla) MUST estar en español.
- **FR-014**: El sistema MUST permitir ver el detalle completo de una tarea por
  ID (incluida la descripción) mediante un comando `show <id>`; un ID
  inexistente produce mensaje de error claro y código de salida 1.

### Key Entities *(include if feature involves data)*

- **Tarea**: Representa una unidad de trabajo personal; atributos: id
  numérico autoincremental, título (obligatorio), descripción (opcional),
  prioridad (high/medium/low), estado (todo/in-progress/done), fecha de
  creación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede crear una tarea en menos de 10 segundos desde
  la terminal.
- **SC-002**: El 100% de las transiciones de estado inválidas son rechazadas
  con mensaje claro y código de salida 1.
- **SC-003**: El listado muestra todas las tareas almacenadas (incluidas las
  terminadas) en menos de 1 segundo para colecciones de hasta 1.000 tareas.
- **SC-004**: El 90% de los usuarios completan el flujo crear → listar →
  completar una tarea en su primer intento sin consultar documentación.
- **SC-005**: Ningún error muestra stack traces al usuario; todos los errores
  presentan un mensaje accionable.

## Assumptions

- Usuario objetivo: personas que gestionan tareas personales desde la
  terminal, sin necesidad de múltiples usuarios.
- La base de datos local es suficiente; no hay sincronización ni concurrencia
  multiusuario.
- Las fechas de creación se registran automáticamente al crear la tarea.
- Fuera de alcance en esta versión: usuarios/autenticación, sincronización
  externa, due dates, subtareas, dependencias, tags/categorías, interfaz web
  o API REST.

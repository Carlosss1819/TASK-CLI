<!--
SYNC IMPACT REPORT
==================
Version change: (unversioned template) → 1.0.0
Modified principles: none (first concrete adoption of the constitution)
Added principles:
  I. Language & Runtime → TypeScript on Node.js LTS
  II. Database → SQLite via better-sqlite3
  III. Project Structure → Simple, flat, by functionality
  IV. Code Style → Functional over classes
  V. CLI Framework → Commander.js
  VI. Error Handling → No stack traces, actionable messages
  VII. Testing → Vitest unit tests for business logic
  VIII. Dependencies → No unnecessary libraries, no ORMs
  IX. Output → Legible terminal output, tables, colored states
  X. Distribution → Globally installable via npm
Added sections: Packaging & Distribution; Development Workflow & Quality Gates
Removed sections: none
Follow-up TODOs: none
==================
-->

# task-cli Constitution

Este proyecto es un CLI de gestión de tareas construido con TypeScript y SQLite.

## Core Principles

### I. Language & Runtime
TypeScript sobre Node.js (versión LTS). La ejecución directa usa tsx o similar.
No se permite depender de runtimes ni versiones de Node fuera de soporte LTS.

### II. Database
SQLite mediante `better-sqlite3`. El archivo de base de datos vive en el
directorio del usuario: `~/.task-cli/tasks.db`. No se usan ORMs ni motores
alternativos.

### III. Project Structure
Estructura simple y plana, organizada por funcionalidad: `commands/`, `db/`,
`utils/`. No se usa clean architecture ni capas excesivas para un CLI de este
tamaño.

### IV. Code Style
Funcional sobre clases. Funciones puras siempre que sea posible. camelCase
para variables y funciones. PascalCase solo para tipos e interfaces.

### V. CLI Framework
Commander.js para el parseo de argumentos y comandos. No se añaden frameworks
CLI alternativos.

### VI. Error Handling
Nunca se muestran stack traces al usuario. Mensajes claros y accionables.
Códigos de salida: 0 para éxito, 1 para error.

### VII. Testing
Tests unitarios con Vitest. No se exige cobertura mínima, pero toda lógica de
negocio debe tener tests.

### VIII. Dependencies
Sin dependencias innecesarias: no se agregan librerías para lo que se resuelve
en pocas líneas de código. No se usan ORMs.

### IX. Output
Toda salida al terminal debe ser legible. Listados en tablas (cli-table3 o
similar). Colores solo para estados y prioridades.

### X. Distribution
El CLI debe ser instalable globalmente con `npm install -g`.

## Packaging & Distribution

- El paquete npm debe exponer un binario ejecutable funcional tras la
  instalación global.
- La base de datos se crea bajo `~/.task-cli/` en el primer uso si no existe.

## Development Workflow & Quality Gates

- Antes de fusionar cambios: los tests de Vitest deben pasar y el CLI debe
  compilar/ejecutarse sin errores.
- Toda nueva lógica de negocio en `commands/`, `db/` o `utils/` requiere tests
  unitarios.
- Las revisiones verifican el cumplimiento de estos principios; la complejidad
  añadida debe justificarse.

## Governance

Esta constitución prevalece sobre cualquier otra práctica del proyecto.
Las enmiendas requieren: documentación del cambio, justificación y
actualización de la versión según versionado semántico. Toda revisión de PR
debe verificar el cumplimiento. Usar el archivo de guía de desarrollo del
runtime para decisiones de implementación cotidianas.

**Version**: 1.0.0 | **Ratified**: 2026-10-01 | **Last Amended**: 2026-10-01

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  colorPriority,
  colorStatus,
  formatCreated,
  printError,
  renderTasksTable,
  translateHelp,
} from '../../src/utils/output';

// T008 — Helpers de presentación (research.md R3, R6; principios VII/IX).
const tareas = [
  {
    id: 2,
    title: 'Pagar factura',
    status: 'in-progress',
    priority: 'high',
    created_at: '2026-10-01T14:23:05.000Z',
  },
  {
    id: 1,
    title: 'Comprar leche',
    status: 'todo',
    priority: 'medium',
    created_at: '2026-10-01T09:10:00.000Z',
  },
];

const sinAnsi = (text: string): string => text.replace(/\x1b\[[0-9;]*m/g, '');

describe('formatCreated — ISO-8601 UTC → YYYY-MM-DD HH:MM:SS', () => {
  it('recorta la fecha a segundos sin sufijo', () => {
    expect(formatCreated('2026-10-01T14:23:05.123Z')).toBe(
      '2026-10-01 14:23:05',
    );
    expect(formatCreated('2026-10-01T09:10:00.000Z')).toBe(
      '2026-10-01 09:10:00',
    );
  });
});

describe('colores ANSI — solo Estado y Prioridad (principio IX)', () => {
  it('colorea estados: todo amarillo, in-progress cian, done verde', () => {
    expect(colorStatus('todo')).toBe('\x1b[33mtodo\x1b[0m');
    expect(colorStatus('in-progress')).toBe('\x1b[36min-progress\x1b[0m');
    expect(colorStatus('done')).toBe('\x1b[32mdone\x1b[0m');
  });

  it('colorea prioridades: high rojo, medium amarillo, low verde', () => {
    expect(colorPriority('high')).toBe('\x1b[31mhigh\x1b[0m');
    expect(colorPriority('medium')).toBe('\x1b[33mmedium\x1b[0m');
    expect(colorPriority('low')).toBe('\x1b[32mlow\x1b[0m');
  });
});

describe('renderTasksTable — cli-table3 con cabeceras en español', () => {
  const tabla = renderTasksTable(tareas);

  it('incluye las cabeceras ID, Título, Estado, Prioridad, Creada', () => {
    const texto = sinAnsi(tabla);
    for (const cabecera of ['ID', 'Título', 'Estado', 'Prioridad', 'Creada']) {
      expect(texto).toContain(cabecera);
    }
  });

  it('incluye los datos de cada tarea con la fecha formateada', () => {
    const texto = sinAnsi(tabla);
    expect(texto).toContain('Pagar factura');
    expect(texto).toContain('Comprar leche');
    expect(texto).toContain('2026-10-01 14:23:05');
    expect(texto).toContain('2026-10-01 09:10:00');
  });

  it('aplica color a Estado y Prioridad', () => {
    expect(tabla).toContain(colorStatus('todo'));
    expect(tabla).toContain(colorStatus('in-progress'));
    expect(tabla).toContain(colorPriority('high'));
    expect(tabla).toContain(colorPriority('medium'));
  });

  it('no colorea ID, Título ni Creada', () => {
    const lineas = tabla.split('\n').filter((l) => l.includes('factura') || l.includes('leche'));
    expect(lineas.length).toBeGreaterThan(0);
    for (const linea of lineas) {
      const soloDatos = linea
        .replace(/\x1b\[3[136]m(in-progress|todo|high|medium)\x1b\[0m/g, '')
        .replace(/│/g, ' ');
      expect(soloDatos).not.toContain('\x1b[');
    }
  });
});

describe('printError — stderr con prefijo Error: y sin stack', () => {
  afterEach(() => vi.restoreAllMocks());

  it('escribe "Error: {mensaje}" por stderr', () => {
    const write = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    printError('el título no puede estar vacío.');
    expect(write).toHaveBeenCalledWith('Error: el título no puede estar vacío.\n');
    const escrito = String(write.mock.calls[0][0]);
    expect(escrito).not.toMatch(/\n\s+at /);
    expect(escrito).not.toContain('stack');
  });
});

describe('translateHelp — textos de Commander al español (FR-013)', () => {
  it('traduce los encabezados de sección', () => {
    const salida = translateHelp(
      'Usage: task-cli [options] [command]\n\nOptions:\n  -h, --help  display help for command\n\nCommands:\n  create      crear\n',
    );
    expect(salida).toContain('Uso:');
    expect(salida).not.toContain('Usage:');
    expect(salida).toContain('Opciones:');
    expect(salida).toContain('Comandos:');
    expect(salida).toContain('mostrar la ayuda del comando');
    expect(salida).not.toContain('display help for command');
  });

  it('traduce los marcadores [options] y [command]', () => {
    const salida = translateHelp('Uso: task-cli [options] [command]\n');
    expect(salida).toContain('[opciones]');
    expect(salida).toContain('[comando]');
    expect(salida).not.toContain('[options]');
    expect(salida).not.toContain('[command]');
  });
});

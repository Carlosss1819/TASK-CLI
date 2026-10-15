import { describe, expect, it } from 'vitest';
import { collectUpdates } from '../../src/commands/update';
import { CliError } from '../../src/utils/errors';

// T027 — V7 citada de data-model.md: "exige al menos uno de
// --title|--description|--priority"; "el status NO se modifica por update";
// V1/V3 reusadas.
function catchError(fn: () => unknown): CliError {
  try {
    fn();
  } catch (error) {
    if (error instanceof CliError) return error;
    throw error;
  }
  throw new Error('se esperaba un CliError y no se lanzó ninguno');
}

describe('collectUpdates (V7)', () => {
  it('rechaza update sin ningún flag de campo', () => {
    const error = catchError(() => collectUpdates({}));
    expect(error.message).toBe(
      'indica al menos un campo a actualizar: --title, --description o --priority.',
    );
    expect(error.exitCode).toBe(1);
  });

  it('acepta cada flag por separado', () => {
    expect(collectUpdates({ title: 'Nuevo' })).toEqual({ title: 'Nuevo' });
    expect(collectUpdates({ description: 'nueva' })).toEqual({
      description: 'nueva',
    });
    expect(collectUpdates({ priority: 'low' })).toEqual({ priority: 'low' });
  });

  it('acepta combinaciones de flags', () => {
    expect(
      collectUpdates({ title: 'Nuevo título', priority: 'high' }),
    ).toEqual({ title: 'Nuevo título', priority: 'high' });
  });

  it('nunca incluye el campo status (V7: para eso está `status`)', () => {
    const updates = collectUpdates({
      title: 'Nuevo',
      description: 'x',
      priority: 'low',
    });
    expect(Object.keys(updates)).not.toContain('status');
    expect(updates).not.toHaveProperty('status');
  });

  it('aplica V1 al título: tras trim() no puede quedar vacío', () => {
    const error = catchError(() => collectUpdates({ title: '   ' }));
    expect(error.message).toBe('el título no puede estar vacío.');
    expect(collectUpdates({ title: '  hola  ' })).toEqual({ title: 'hola' });
  });

  it('aplica V3 a la prioridad: solo high|medium|low', () => {
    expect(collectUpdates({ priority: 'high' })).toEqual({
      priority: 'high',
    });
    const error = catchError(() => collectUpdates({ priority: 'urgent' }));
    expect(error.message).toBe(
      'prioridad inválida "urgent". Valores válidos: high, medium, low.',
    );
  });

  it('la descripción es cadena libre y puede ser vacía (V2)', () => {
    expect(collectUpdates({ description: '' })).toEqual({ description: '' });
  });
});

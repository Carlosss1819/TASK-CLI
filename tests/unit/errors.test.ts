import { describe, expect, it } from 'vitest';
import { CliError } from '../../src/utils/errors';

// T006 — Contrato de errores (research.md R7, FR-011):
// mensaje en español, exitCode 1 y nunca exponer stack traces.
describe('CliError', () => {
  it('conserva el mensaje en español tal cual', () => {
    const error = new CliError('el título no puede estar vacío.');
    expect(error.message).toBe('el título no puede estar vacío.');
  });

  it('usa exitCode 1 por defecto', () => {
    const error = new CliError('algo falló.');
    expect(error.exitCode).toBe(1);
  });

  it('permite indicar un código de salida personalizado', () => {
    const error = new CliError('algo falló.', 2);
    expect(error.exitCode).toBe(2);
  });

  it('es una instancia de Error', () => {
    const error = new CliError('algo falló.');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CliError);
    expect(error.name).toBe('CliError');
  });

  it('la representación en texto no incluye fotogramas de stack', () => {
    const error = new CliError('algo falló.');
    expect(String(error)).toBe('CliError: algo falló.');
    expect(String(error)).not.toMatch(/\n\s+at /);
  });
});

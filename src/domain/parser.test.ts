import { describe, it, expect } from 'vitest';
import { parseInput } from './parser';

// Fecha de referencia fija para que los tests sean deterministas.
// Sábado 13 de junio de 2026, 08:00 local.
const NOW = new Date(2026, 5, 13, 8, 0, 0);

function asDate(ms: number | null): Date {
  expect(ms).not.toBeNull();
  return new Date(ms as number);
}

describe('parseInput', () => {
  it('"mañana a las 10" -> mañana 10:00, prioridad media', () => {
    const { title, dueAt, priority } = parseInput('llamar al fontanero mañana a las 10', NOW);
    expect(title).toBe('Llamar al fontanero');
    expect(priority).toBe('media');
    const d = asDate(dueAt);
    expect(d.getDate()).toBe(14); // 13 + 1
    expect(d.getMonth()).toBe(5); // junio
    expect(d.getHours()).toBe(10);
    expect(d.getMinutes()).toBe(0);
  });

  it('"el viernes urgente" -> próximo viernes 09:00, prioridad alta', () => {
    const { dueAt, priority } = parseInput('el viernes urgente', NOW);
    expect(priority).toBe('alta');
    const d = asDate(dueAt);
    expect(d.getDay()).toBe(5); // viernes
    expect(d.getDate()).toBe(19); // próximo viernes
    expect(d.getHours()).toBe(9); // hora por defecto
    expect(d.getMinutes()).toBe(0);
  });

  it('frase sin fecha -> dueAt null, prioridad media', () => {
    const { title, dueAt, priority } = parseInput('comprar leche', NOW);
    expect(title).toBe('Comprar leche');
    expect(dueAt).toBeNull();
    expect(priority).toBe('media');
  });

  it('"el 20 de junio a las 16:30" -> fecha y hora exactas', () => {
    const { title, dueAt, priority } = parseInput('reunión el 20 de junio a las 16:30', NOW);
    expect(title).toBe('Reunión');
    expect(priority).toBe('media');
    const d = asDate(dueAt);
    expect(d.getDate()).toBe(20);
    expect(d.getMonth()).toBe(5); // junio
    expect(d.getHours()).toBe(16);
    expect(d.getMinutes()).toBe(30);
  });

  it('prioridad baja por palabra clave, eliminada del título', () => {
    const { title, dueAt, priority } = parseInput('ordenar el garaje sin prisa', NOW);
    expect(priority).toBe('baja');
    expect(title).toBe('Ordenar el garaje');
    expect(dueAt).toBeNull();
  });

  it('criterio de aceptación: "enviar factura el viernes urgente"', () => {
    const { title, dueAt, priority } = parseInput('enviar factura el viernes urgente', NOW);
    expect(title).toBe('Enviar factura');
    expect(priority).toBe('alta');
    const d = asDate(dueAt);
    expect(d.getDay()).toBe(5); // viernes
    expect(d.getHours()).toBe(9);
  });

  it('llamadas repetidas no se contaminan entre sí (regex global)', () => {
    expect(parseInput('urgente revisar', NOW).priority).toBe('alta');
    // Si lastIndex se filtrara, esta segunda llamada podría fallar.
    expect(parseInput('urgente revisar', NOW).priority).toBe('alta');
  });
});

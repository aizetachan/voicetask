import { describe, it, expect } from 'vitest';
import { formatRelative, formatDayLabel } from './format';

const NOW = new Date(2026, 5, 13, 10, 0, 0); // sáb 13 jun 2026

describe('format', () => {
  it('etiqueta días relativos', () => {
    expect(formatDayLabel(new Date(2026, 5, 13, 9, 0).getTime(), NOW)).toBe('Hoy');
    expect(formatDayLabel(new Date(2026, 5, 14, 9, 0).getTime(), NOW)).toBe('Mañana');
    expect(formatDayLabel(new Date(2026, 5, 12, 9, 0).getTime(), NOW)).toBe('Ayer');
    expect(formatDayLabel(new Date(2026, 5, 19, 9, 0).getTime(), NOW)).toBe('vie');
    expect(formatDayLabel(new Date(2026, 6, 20, 9, 0).getTime(), NOW)).toBe('20 jul');
  });

  it('formatRelative combina día y hora; null = "Sin fecha"', () => {
    expect(formatRelative(new Date(2026, 5, 14, 10, 0).getTime(), NOW)).toBe('Mañana · 10:00');
    expect(formatRelative(null, NOW)).toBe('Sin fecha');
  });
});

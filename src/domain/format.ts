// Formato de fechas relativas en español. Dominio puro.

const DAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MONTHS_SHORT = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/** Diferencia en días naturales entre dos instantes (b - a). */
function dayDiff(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86_400_000);
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatTime(dueAt: number): string {
  const d = new Date(dueAt);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Etiqueta de día legible: "Hoy", "Mañana", "Ayer", "vie" o "13 jun". */
export function formatDayLabel(dueAt: number, now: Date = new Date()): string {
  const d = new Date(dueAt);
  const diff = dayDiff(now, d);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  if (diff > 1 && diff < 7) return DAYS_SHORT[d.getDay()];
  const sameYear = d.getFullYear() === now.getFullYear();
  const base = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  return sameYear ? base : `${base} ${d.getFullYear()}`;
}

/** Fecha relativa completa para la tarjeta y el preview: "Mañana · 10:00". */
export function formatRelative(dueAt: number | null, now: Date = new Date()): string {
  if (dueAt === null) return 'Sin fecha';
  return `${formatDayLabel(dueAt, now)} · ${formatTime(dueAt)}`;
}

/** Cabecera del widget / app: "sáb 13 jun". */
export function formatHeaderDate(now: Date = new Date()): string {
  return `${DAYS_SHORT[now.getDay()]} ${now.getDate()} ${MONTHS_SHORT[now.getMonth()]}`;
}

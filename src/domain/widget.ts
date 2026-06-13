// Construye el snapshot ligero que consume el widget de iOS. Dominio puro.
//
// Selección: primero atrasadas, luego hoy y las más próximas por fecha;
// excluye completadas; rellena con las sin fecha (más recientes) solo si sobra
// hueco. El widget toma tantas filas como le quepan de esta lista ordenada.

import type { Priority, Task } from './task';

export interface WidgetTask {
  title: string;
  dueAt: number | null;
  priority: Priority;
  done: boolean;
}

const DEFAULT_LIMIT = 10;

export function buildWidgetSnapshot(
  tasks: Task[],
  now: Date = new Date(),
  limit: number = DEFAULT_LIMIT,
): WidgetTask[] {
  const nowMs = now.getTime();
  const pending = tasks.filter((t) => !t.done);

  const withDate = pending.filter((t) => t.dueAt !== null) as (Task & { dueAt: number })[];
  const overdue = withDate
    .filter((t) => t.dueAt < nowMs)
    .sort((a, b) => a.dueAt - b.dueAt);
  const upcoming = withDate
    .filter((t) => t.dueAt >= nowMs)
    .sort((a, b) => a.dueAt - b.dueAt);

  // Relleno: sin fecha, las más recientes primero (solo si sobra hueco al cortar).
  const noDate = pending
    .filter((t) => t.dueAt === null)
    .sort((a, b) => b.createdAt - a.createdAt);

  const ordered = [...overdue, ...upcoming, ...noDate].slice(0, limit);

  return ordered.map((t) => ({
    title: t.title,
    dueAt: t.dueAt,
    priority: t.priority,
    done: false,
  }));
}

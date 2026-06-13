// Dominio puro: sin React, sin Capacitor. Solo tipos y lógica de estado.

export type Priority = 'alta' | 'media' | 'baja';

export interface Task {
  id: string; // crypto.randomUUID()
  title: string;
  dueAt: number | null; // epoch ms, null = sin fecha
  priority: Priority;
  done: boolean;
  createdAt: number;
  notificationId?: number; // id de la notificación local programada
}

export const PRIORITIES: Priority[] = ['alta', 'media', 'baja'];

/** Orden de prioridad para comparaciones (menor = más urgente). */
export const PRIORITY_WEIGHT: Record<Priority, number> = {
  alta: 0,
  media: 1,
  baja: 2,
};

/** Grupos en los que se clasifica una tarea para la lista. */
export type TaskGroup =
  | 'atrasadas'
  | 'hoy'
  | 'manana'
  | 'semana'
  | 'mas-adelante'
  | 'sin-fecha'
  | 'hechas';

export function isOverdue(task: Task, now = Date.now()): boolean {
  return !task.done && task.dueAt !== null && task.dueAt < now;
}

/** Crea una tarea nueva a partir de los campos extraídos del parser. */
export function createTask(input: {
  title: string;
  dueAt: number | null;
  priority: Priority;
}): Task {
  return {
    id: crypto.randomUUID(),
    title: input.title,
    dueAt: input.dueAt,
    priority: input.priority,
    done: false,
    createdAt: Date.now(),
  };
}

// Ordenación y agrupación de tareas para la lista. Dominio puro.

import type { Task, TaskGroup } from './task';
import { PRIORITY_WEIGHT } from './task';

export interface GroupedTasks {
  key: TaskGroup;
  label: string;
  tasks: Task[];
}

const GROUP_LABELS: Record<TaskGroup, string> = {
  atrasadas: 'Atrasadas',
  hoy: 'Hoy',
  manana: 'Mañana',
  semana: 'Esta semana',
  'mas-adelante': 'Más adelante',
  'sin-fecha': 'Sin fecha',
  hechas: 'Hechas',
};

// Orden en el que se muestran los grupos.
const GROUP_ORDER: TaskGroup[] = [
  'atrasadas',
  'hoy',
  'manana',
  'semana',
  'mas-adelante',
  'sin-fecha',
  'hechas',
];

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/** Final (23:59:59.999) del domingo de la semana actual (semana lun-dom). */
function endOfWeek(now: Date): number {
  const c = startOfDay(now);
  const day = c.getDay(); // 0 = domingo
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  c.setDate(c.getDate() + daysUntilSunday);
  c.setHours(23, 59, 59, 999);
  return c.getTime();
}

/** Clasifica una tarea pendiente con fecha en su grupo temporal. */
function groupForPending(task: Task, now: Date): TaskGroup {
  if (task.dueAt === null) return 'sin-fecha';
  const nowMs = now.getTime();
  if (task.dueAt < nowMs) return 'atrasadas';

  const todayStart = startOfDay(now).getTime();
  const tomorrowStart = todayStart + 86_400_000;
  const dayAfterTomorrowStart = tomorrowStart + 86_400_000;

  if (task.dueAt < tomorrowStart) return 'hoy';
  if (task.dueAt < dayAfterTomorrowStart) return 'manana';
  if (task.dueAt <= endOfWeek(now)) return 'semana';
  return 'mas-adelante';
}

/** Comparador de pendientes: por fecha asc, las sin fecha al final; desempata prioridad. */
function comparePending(a: Task, b: Task): number {
  if (a.dueAt === null && b.dueAt === null) {
    return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
  }
  if (a.dueAt === null) return 1;
  if (b.dueAt === null) return -1;
  if (a.dueAt !== b.dueAt) return a.dueAt - b.dueAt;
  return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
}

/** Agrupa y ordena las tareas. Devuelve solo los grupos no vacíos, en orden. */
export function groupTasks(tasks: Task[], now: Date = new Date()): GroupedTasks[] {
  const buckets = new Map<TaskGroup, Task[]>();

  for (const task of tasks) {
    const key: TaskGroup = task.done ? 'hechas' : groupForPending(task, now);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(task);
    else buckets.set(key, [task]);
  }

  const result: GroupedTasks[] = [];
  for (const key of GROUP_ORDER) {
    const bucket = buckets.get(key);
    if (!bucket || bucket.length === 0) continue;
    if (key === 'hechas') {
      bucket.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      bucket.sort(comparePending);
    }
    result.push({ key, label: GROUP_LABELS[key], tasks: bucket });
  }
  return result;
}

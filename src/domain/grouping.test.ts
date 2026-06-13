import { describe, it, expect } from 'vitest';
import { groupTasks } from './grouping';
import { createTask, type Task } from './task';

const NOW = new Date(2026, 5, 13, 10, 0, 0); // sáb 13 jun 2026, 10:00

function make(partial: Partial<Task>): Task {
  return { ...createTask({ title: 't', dueAt: null, priority: 'media' }), ...partial };
}

describe('groupTasks', () => {
  it('clasifica en los grupos correctos y omite los vacíos', () => {
    const tasks: Task[] = [
      make({ id: 'a', dueAt: new Date(2026, 5, 12, 9, 0).getTime() }), // atrasada
      make({ id: 'b', dueAt: new Date(2026, 5, 13, 18, 0).getTime() }), // hoy
      make({ id: 'c', dueAt: new Date(2026, 5, 14, 9, 0).getTime() }), // mañana
      make({ id: 'd', dueAt: null }), // sin fecha
      make({ id: 'e', dueAt: new Date(2026, 5, 13, 12, 0).getTime(), done: true }), // hecha
    ];
    const groups = groupTasks(tasks, NOW);
    const keys = groups.map((g) => g.key);
    expect(keys).toEqual(['atrasadas', 'hoy', 'manana', 'sin-fecha', 'hechas']);
  });

  it('ordena los pendientes por fecha ascendente, sin fecha al final', () => {
    const tasks: Task[] = [
      make({ id: 'late', dueAt: new Date(2026, 5, 20).getTime() }),
      make({ id: 'none', dueAt: null }),
      make({ id: 'soon', dueAt: new Date(2026, 5, 15).getTime() }),
    ];
    const groups = groupTasks(tasks, NOW);
    const allPending = groups.flatMap((g) => g.tasks.map((t) => t.id));
    expect(allPending).toEqual(['soon', 'late', 'none']);
  });
});

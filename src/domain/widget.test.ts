import { describe, it, expect } from 'vitest';
import { buildWidgetSnapshot } from './widget';
import { createTask, type Task } from './task';

const NOW = new Date(2026, 5, 13, 10, 0, 0);

function make(p: Partial<Task>): Task {
  return { ...createTask({ title: 't', dueAt: null, priority: 'media' }), ...p };
}

describe('buildWidgetSnapshot', () => {
  it('ordena atrasadas, luego próximas; excluye completadas', () => {
    const tasks: Task[] = [
      make({ title: 'futura', dueAt: new Date(2026, 5, 18).getTime() }),
      make({ title: 'atrasada', dueAt: new Date(2026, 5, 12).getTime() }),
      make({ title: 'hoy', dueAt: new Date(2026, 5, 13, 20).getTime() }),
      make({ title: 'hecha', dueAt: new Date(2026, 5, 13, 21).getTime(), done: true }),
    ];
    const snap = buildWidgetSnapshot(tasks, NOW);
    expect(snap.map((t) => t.title)).toEqual(['atrasada', 'hoy', 'futura']);
    expect(snap.every((t) => t.done === false)).toBe(true);
  });

  it('rellena con las sin fecha (recientes) solo al final', () => {
    const tasks: Task[] = [
      make({ title: 'sinfecha-vieja', dueAt: null, createdAt: 1 }),
      make({ title: 'sinfecha-nueva', dueAt: null, createdAt: 2 }),
      make({ title: 'confecha', dueAt: new Date(2026, 5, 15).getTime() }),
    ];
    const snap = buildWidgetSnapshot(tasks, NOW);
    expect(snap.map((t) => t.title)).toEqual([
      'confecha',
      'sinfecha-nueva',
      'sinfecha-vieja',
    ]);
  });

  it('respeta el límite', () => {
    const tasks = Array.from({ length: 20 }, (_, i) =>
      make({ title: `t${i}`, dueAt: new Date(2026, 5, 14 + i).getTime() }),
    );
    expect(buildWidgetSnapshot(tasks, NOW, 5)).toHaveLength(5);
  });
});

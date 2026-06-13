import type { GroupedTasks } from '../../domain/grouping';
import { TaskCard } from './TaskCard';

interface Props {
  group: GroupedTasks;
  now: Date;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskGroup({ group, now, onToggle, onDelete }: Props) {
  return (
    <section className="group">
      <h2 className="group__label">
        {group.label}
        <span className="group__count">{group.tasks.length}</span>
      </h2>
      <ul className="group__list">
        {group.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            now={now}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </section>
  );
}

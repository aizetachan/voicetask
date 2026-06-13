import type { Task } from '../../domain/task';
import { isOverdue } from '../../domain/task';
import { formatRelative } from '../../domain/format';

interface Props {
  task: Task;
  now: Date;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, now, onToggle, onDelete }: Props) {
  const overdue = isOverdue(task, now.getTime());

  return (
    <li className={`card${task.done ? ' card--done' : ''}`}>
      <button
        type="button"
        className={`check check--${task.priority}${task.done ? ' check--on' : ''}`}
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? 'Marcar como pendiente' : 'Completar tarea'}
        onClick={() => onToggle(task.id)}
      >
        {task.done ? '✓' : ''}
      </button>

      <div className="card__body">
        <span className="card__title">{task.title}</span>
        {task.dueAt !== null && (
          <span className={`card__date${overdue ? ' card__date--overdue' : ''}`}>
            {formatRelative(task.dueAt, now)}
          </span>
        )}
      </div>

      <button
        type="button"
        className="card__delete"
        aria-label="Borrar tarea"
        onClick={() => onDelete(task.id)}
      >
        ✕
      </button>
    </li>
  );
}

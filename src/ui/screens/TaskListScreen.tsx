import { useTasks } from '../../store/tasksStore';
import { formatHeaderDate } from '../../domain/format';
import { CaptureBar } from '../components/CaptureBar';
import { TaskGroup } from '../components/TaskGroup';
import { EmptyState } from '../components/EmptyState';

export function TaskListScreen() {
  const { groups, tasks, loaded, addTask, toggleTask, deleteTask } = useTasks();
  const now = new Date();
  const isEmpty = loaded && tasks.length === 0;

  return (
    <div className="screen">
      <header className="screen__header">
        <h1 className="screen__title">Ahora</h1>
        <span className="screen__date">{formatHeaderDate(now)}</span>
      </header>

      <main className="screen__list">
        {isEmpty ? (
          <EmptyState />
        ) : (
          groups.map((group) => (
            <TaskGroup
              key={group.key}
              group={group}
              now={now}
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
          ))
        )}
      </main>

      <CaptureBar onAdd={addTask} />
    </div>
  );
}

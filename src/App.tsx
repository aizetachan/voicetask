import { TasksProvider } from './store/tasksStore';
import { TaskListScreen } from './ui/screens/TaskListScreen';

export default function App() {
  return (
    <TasksProvider>
      <TaskListScreen />
    </TasksProvider>
  );
}

import { useEffect } from 'react';
import { TasksProvider } from './store/tasksStore';
import { TaskListScreen } from './ui/screens/TaskListScreen';
import { initDeepLinks } from './services/deeplink';

export default function App() {
  useEffect(() => initDeepLinks(), []);

  return (
    <TasksProvider>
      <TaskListScreen />
    </TasksProvider>
  );
}

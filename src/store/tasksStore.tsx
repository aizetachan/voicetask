import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { createTask, type Task } from '../domain/task';
import type { ParsedTask } from '../domain/parser';
import { groupTasks, type GroupedTasks } from '../domain/grouping';
import { storage, STORAGE_KEYS } from '../services/storage';

interface State {
  tasks: Task[];
  loaded: boolean;
}

type Action =
  | { type: 'load'; tasks: Task[] }
  | { type: 'add'; task: Task }
  | { type: 'toggle'; id: string }
  | { type: 'delete'; id: string }
  | { type: 'update'; task: Task };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'load':
      return { tasks: action.tasks, loaded: true };
    case 'add':
      return { ...state, tasks: [...state.tasks, action.task] };
    case 'toggle':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, done: !t.done } : t,
        ),
      };
    case 'delete':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
    case 'update':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.task.id ? action.task : t)),
      };
    default:
      return state;
  }
}

interface TasksContextValue {
  tasks: Task[];
  groups: GroupedTasks[];
  loaded: boolean;
  addTask: (parsed: ParsedTask) => Task;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { tasks: [], loaded: false });

  // Carga inicial desde el almacenamiento.
  useEffect(() => {
    let cancelled = false;
    storage.load<Task[]>(STORAGE_KEYS.tasks).then((tasks) => {
      if (!cancelled) dispatch({ type: 'load', tasks: tasks ?? [] });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persiste cada cambio una vez cargado (no sobreescribe antes de leer).
  useEffect(() => {
    if (!state.loaded) return;
    void storage.save(STORAGE_KEYS.tasks, state.tasks);
  }, [state.tasks, state.loaded]);

  const value = useMemo<TasksContextValue>(() => {
    const groups = groupTasks(state.tasks, new Date());
    return {
      tasks: state.tasks,
      groups,
      loaded: state.loaded,
      addTask: (parsed) => {
        const task = createTask(parsed);
        dispatch({ type: 'add', task });
        return task;
      },
      toggleTask: (id) => dispatch({ type: 'toggle', id }),
      deleteTask: (id) => dispatch({ type: 'delete', id }),
    };
  }, [state.tasks, state.loaded]);

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks debe usarse dentro de <TasksProvider>');
  return ctx;
}

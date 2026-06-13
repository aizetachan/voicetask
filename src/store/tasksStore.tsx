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
import { buildWidgetSnapshot } from '../domain/widget';
import { storage, STORAGE_KEYS } from '../services/storage';
import { notifications } from '../services/notifications';
import { pushWidgetSnapshot } from '../services/widgetBridge';

interface State {
  tasks: Task[];
  loaded: boolean;
}

type Action =
  | { type: 'load'; tasks: Task[] }
  | { type: 'add'; task: Task }
  | { type: 'toggle'; id: string }
  | { type: 'delete'; id: string }
  | { type: 'patch'; id: string; patch: Partial<Task> };

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
    case 'patch':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, ...action.patch } : t,
        ),
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

  // Persiste cada cambio una vez cargado (no sobreescribe antes de leer) y
  // actualiza el snapshot del widget (App Group + recarga de timelines).
  useEffect(() => {
    if (!state.loaded) return;
    void storage.save(STORAGE_KEYS.tasks, state.tasks);
    void pushWidgetSnapshot(buildWidgetSnapshot(state.tasks, new Date()));
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
        // Programa la notificación (si hay fecha futura) y guarda su id.
        void notifications.scheduleTask(task).then((notificationId) => {
          if (notificationId !== undefined) {
            dispatch({ type: 'patch', id: task.id, patch: { notificationId } });
          }
        });
        return task;
      },
      toggleTask: (id) => {
        const task = state.tasks.find((t) => t.id === id);
        dispatch({ type: 'toggle', id });
        if (!task) return;
        if (!task.done) {
          // Pasa a completada: cancela su notificación.
          if (task.notificationId !== undefined) void notifications.cancel(task.notificationId);
        } else {
          // Vuelve a pendiente: reprograma si aún es futura.
          void notifications.scheduleTask({ ...task, done: false }).then((notificationId) => {
            if (notificationId !== undefined) {
              dispatch({ type: 'patch', id, patch: { notificationId } });
            }
          });
        }
      },
      deleteTask: (id) => {
        const task = state.tasks.find((t) => t.id === id);
        if (task?.notificationId !== undefined) void notifications.cancel(task.notificationId);
        dispatch({ type: 'delete', id });
      },
    };
  }, [state.tasks, state.loaded]);

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks debe usarse dentro de <TasksProvider>');
  return ctx;
}

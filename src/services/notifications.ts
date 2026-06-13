// Notificaciones locales por tarea. Aísla la plataforma: nativo vía
// @capacitor/local-notifications; en web degrada con elegancia (no-op).

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Task } from '../domain/task';
import { formatRelative } from '../domain/format';

const isNative = Capacitor.isNativePlatform();

/** Id numérico de 31 bits para la notificación (requisito de la plataforma). */
function newNotificationId(): number {
  return Math.floor(Math.random() * 2_000_000_000) + 1;
}

let permissionAsked = false;

/**
 * Pide permiso de notificaciones de forma no intrusiva: solo se invoca al
 * programar (es decir, al crear la primera tarea con fecha), nunca en seco.
 */
async function ensurePermission(): Promise<boolean> {
  if (!isNative) return false;
  try {
    let status = await LocalNotifications.checkPermissions();
    if (status.display === 'prompt' || status.display === 'prompt-with-rationale') {
      if (permissionAsked) return false;
      permissionAsked = true;
      status = await LocalNotifications.requestPermissions();
    }
    return status.display === 'granted';
  } catch {
    return false;
  }
}

export interface NotificationsService {
  readonly isSupported: boolean;
  /** Programa la notificación de una tarea con fecha futura. Devuelve su id. */
  scheduleTask(task: Task): Promise<number | undefined>;
  /** Cancela una notificación previamente programada. */
  cancel(notificationId: number): Promise<void>;
}

export const notifications: NotificationsService = {
  isSupported: isNative,

  async scheduleTask(task: Task): Promise<number | undefined> {
    if (!isNative) return undefined;
    if (task.dueAt === null || task.dueAt <= Date.now()) return undefined;

    const granted = await ensurePermission();
    if (!granted) return undefined;

    const id = newNotificationId();
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title: task.title || 'Tarea',
            body: formatRelative(task.dueAt),
            schedule: { at: new Date(task.dueAt) },
          },
        ],
      });
      return id;
    } catch {
      return undefined;
    }
  },

  async cancel(notificationId: number): Promise<void> {
    if (!isNative) return;
    try {
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
    } catch {
      /* noop */
    }
  },
};

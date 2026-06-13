// Puente con el widget de iOS: escribe el snapshot en el App Group y pide al
// widget recargar sus timelines. En web es no-op pero deja el JSON en
// localStorage como PUNTO DE VERIFICACIÓN para inspeccionar lo compartido.

import { Capacitor, registerPlugin } from '@capacitor/core';
import type { WidgetTask } from '../domain/widget';

export interface WidgetBridgePlugin {
  /** Escribe el JSON en UserDefaults(App Group) y llama reloadAllTimelines(). */
  updateSnapshot(options: { tasks: string }): Promise<void>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

/** Clave de verificación en web (inspeccionable en DevTools → localStorage). */
export const WIDGET_SNAPSHOT_DEBUG_KEY = 'ahora.widget.snapshot';

export async function pushWidgetSnapshot(items: WidgetTask[]): Promise<void> {
  const json = JSON.stringify(items);

  if (!Capacitor.isNativePlatform()) {
    // Verificación en desarrollo web: deja el JSON compartido a la vista.
    try {
      localStorage.setItem(WIDGET_SNAPSHOT_DEBUG_KEY, json);
    } catch {
      /* noop */
    }
    return;
  }

  try {
    await WidgetBridge.updateSnapshot({ tasks: json });
  } catch {
    // El plugin nativo solo existe en el build de iOS; ignora en su ausencia.
  }
}

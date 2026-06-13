// Manejo de deep links (esquema `ahora://`). Extensible: registra rutas por
// host. Hoy `ahora://abrir` solo muestra la lista (comportamiento por defecto).

import { Capacitor } from '@capacitor/core';
import { App, type URLOpenListenerEvent } from '@capacitor/app';

export type DeepLinkHandler = (url: URL) => void;

// Mapa host -> handler. Añadir aquí futuras rutas, p.ej. 'dictar'.
const routes: Record<string, DeepLinkHandler> = {
  abrir: () => {
    // No-op: abrir la app ya muestra la lista. Punto de extensión.
  },
};

function handleUrl(rawUrl: string): void {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return;
  }
  if (url.protocol !== 'ahora:') return;
  const route = routes[url.host];
  if (route) route(url);
}

/** Registra una ruta de deep link adicional (extensibilidad futura). */
export function registerDeepLink(host: string, handler: DeepLinkHandler): void {
  routes[host] = handler;
}

/** Inicia la escucha de deep links. Devuelve una función de limpieza. */
export function initDeepLinks(): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};
  const handlePromise = App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    handleUrl(event.url);
  });
  return () => {
    void handlePromise.then((handle) => handle.remove());
  };
}

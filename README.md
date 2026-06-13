# Ahora

App de **captura ultrarrápida de tareas**. Escribes o dictas una frase en
lenguaje natural —«llamar al fontanero mañana a las 10 urgente»— y se crea una
ficha con **título, fecha/hora y prioridad**, sin formularios.

- **100% offline.** Sin backend ni cuentas: todo vive en el dispositivo.
- **Web-first**, empaquetada como app nativa **iOS** (prioritario) y **Android**
  con Capacitor.
- **Parsing local** con `chrono-node` (sin LLM ni APIs externas).
- **Widget de iOS** (systemMedium) con las tareas próximas, vía App Group.

---

## Stack

| Capa | Tecnología |
|------|------------|
| UI | React 18 + TypeScript + Vite |
| Nativo | Capacitor 6 (iOS / Android) |
| Fechas | `chrono-node` (`chrono.es`) |
| Persistencia | `@capacitor/preferences` (fallback a `localStorage` en web) |
| Notificaciones | `@capacitor/local-notifications` |
| Voz | `@capacitor-community/speech-recognition` + Web Speech API |
| Deep links | `@capacitor/app` (esquema `ahora://`) |
| Tests | Vitest |

### Arquitectura

```
src/
  domain/      # lógica pura: SIN React ni Capacitor
    task.ts        # tipo Task, prioridades, helpers de estado
    parser.ts      # parseInput(text) -> {title, dueAt, priority}
    grouping.ts    # agrupación y orden de la lista
    format.ts      # fechas relativas en español
  services/    # adaptadores de plataforma (todo lo "sucio")
    storage.ts        # interfaz Storage + Preferences/localStorage
    notifications.ts  # programar/cancelar notificación por tarea
    dictation.ts      # reconocimiento de voz unificado
    deeplink.ts       # router de deep links (extensible)
  store/
    tasksStore.tsx    # CRUD, persistencia, side-effects de notificaciones
  ui/
    components/  # TaskCard, CaptureBar, LivePreview, TaskGroup, EmptyState…
    hooks/       # useDictation
    screens/     # TaskListScreen
```

**Regla de oro:** `domain/` no importa nada de React ni de Capacitor.
`parser.ts` es una función pura testeable en aislamiento.

---

## Requisitos

- **Node** ≥ 18 (probado con 22) y npm
- Para **iOS**: macOS con **Xcode** 15+, **CocoaPods** (`sudo gem install cocoapods`)
- Para **Android**: Android Studio / SDK + JDK 17

---

## Desarrollo en web

```bash
npm install
npm run dev      # http://localhost:5173
```

- La persistencia usa `localStorage` (las notificaciones y el dictado nativo
  degradan con elegancia; el dictado web funciona en Chrome/Safari).

### Tests

```bash
npm test         # Vitest (parser, grouping, format)
```

### Build de producción (web)

```bash
npm run build    # tsc + vite -> dist/
```

---

## Empaquetado nativo

Las plataformas `ios/` y `android/` ya están generadas y versionadas. El flujo
de trabajo tras cualquier cambio en el código web es siempre:

```bash
npm run build && npx cap sync
```

### iOS (simulador / dispositivo)

> Requiere macOS + Xcode + CocoaPods.

```bash
npm run build
npx cap sync ios          # copia web + instala Pods
npx cap open ios          # abre Xcode
```

En Xcode:

1. Selecciona el target **App** → pestaña **Signing & Capabilities** y elige tu
   Team.
2. Pulsa ▶︎ con un simulador de iPhone seleccionado.

**Permisos** (ya en `ios/App/App/Info.plist`, descripciones en español):
`NSMicrophoneUsageDescription`, `NSSpeechRecognitionUsageDescription`.

**URL scheme** `ahora://` registrado en `Info.plist` (`CFBundleURLTypes`).

### Android

```bash
npm run build
npx cap sync android
npx cap open android      # abre Android Studio
```

El esquema `ahora://` está registrado como intent-filter en
`AndroidManifest.xml`. Los permisos de micrófono y notificaciones los aportan
los plugins vía manifest merging.

---

## App Group + Widget de iOS

El widget nativo (WidgetKit) lee un snapshot de tareas que la app escribe en un
**App Group** compartido: `group.com.nakama.ahora`.

> El plugin nativo del snapshot y el Widget Extension se documentan en las
> secciones siguientes a medida que se implementan (fases 7 y 8). El App Group
> ya está declarado en `ios/App/App/App.entitlements`.

**Activar el App Group en Xcode** (target **App**):
Signing & Capabilities → **+ Capability** → **App Groups** → marca
`group.com.nakama.ahora`. (El mismo grupo se activará en el target del widget.)

---

## Comandos útiles

| Acción | Comando |
|--------|---------|
| Dev web | `npm run dev` |
| Tests | `npm test` |
| Build web | `npm run build` |
| Sync nativo | `npx cap sync` |
| Abrir iOS | `npx cap open ios` |
| Abrir Android | `npx cap open android` |

---

## Criterios de aceptación

- «enviar factura el viernes urgente» → tarea **"Enviar factura"**, próximo
  viernes 09:00, prioridad **alta**. ✅ (cubierto por tests)
- Cerrar y reabrir conserva las tareas. ✅
- El parser pasa todos sus tests. ✅ (`npm test`)
- `domain/` sin imports de React ni Capacitor. ✅

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

## Iconos y splash

Se generan con [`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets)
a partir de imágenes fuente en `assets/`:

```bash
npm run assets
```

Esto regenera **todos** los tamaños de icono y splash de iOS y Android. Las
fuentes (`assets/icon-only.png`, `icon-foreground.png`, `icon-background.png`,
`splash.png`, `splash-dark.png`) las crea `scripts/gen-assets.mjs` como un
placeholder de marca (check en la tinta de acento sobre fondo oscuro).

**Para usar tu propio logo:** sustituye los PNG de `assets/` por los tuyos
(icono 1024×1024, splash 2732×2732) y ejecuta `npm run assets`. Si solo quieres
cambiar el placeholder, edita `scripts/gen-assets.mjs`.

## App Group + Widget de iOS

El widget nativo (WidgetKit) lee un snapshot de tareas que la app escribe en un
**App Group** compartido: `group.com.nakama.ahora`.

Flujo de datos:

```
tasksStore  ──build──▶  buildWidgetSnapshot()  ──JSON──▶  WidgetBridge (Swift)
                                                              │
                            UserDefaults(suiteName: group)  ◀─┘
                            WidgetCenter.reloadAllTimelines()
                                          │
                                          ▼
                            AhoraWidget lee el snapshot y se redibuja
```

Cada vez que cambian las tareas, la app llama a `pushWidgetSnapshot()`
(`src/services/widgetBridge.ts`), que invoca el plugin nativo
`WidgetBridge.updateSnapshot({ tasks })`. El plugin escribe el JSON en el App
Group y llama `WidgetCenter.shared.reloadAllTimelines()`.

### Punto de verificación del JSON compartido

- **En web (dev):** `pushWidgetSnapshot` deja el JSON en
  `localStorage["ahora.widget.snapshot"]`. Inspecciónalo en DevTools →
  Application → Local Storage para comprobar el array ordenado
  `{title, dueAt, priority, done}`.
- **En iOS:** tras crear/completar tareas, el widget debe reflejar el cambio.
  Para depurar, el snapshot vive en
  `UserDefaults(suiteName: "group.com.nakama.ahora")`, clave `ahora.snapshot`.

### 1) Activar el App Group (target App)

Xcode → target **App** → **Signing & Capabilities** → **+ Capability** →
**App Groups** → marca/crea `group.com.nakama.ahora`. Esto enlaza
`ios/App/App/App.entitlements` (ya incluido).

### 2) Plugin nativo `WidgetBridge` (ya cableado)

Los fuentes están en `ios/App/App/WidgetBridge/` (`WidgetBridgePlugin.swift` +
`WidgetBridgePlugin.m`) y **ya están añadidos al target App** en el
`project.pbxproj` versionado, así que no hay nada que hacer en Xcode.

> Si en algún momento regeneras la carpeta `ios/` desde cero (`cap add ios`),
> vuelve a cablearlo con: `node scripts/wire-widget-plugin.mjs` (es
> idempotente). El plugin se registra solo en JS como `WidgetBridge`.

### 3) Crear el Widget Extension target

El código del widget ya está escrito en `ios/AhoraWidget/`
(`AhoraWidget.swift`, `Info.plist`, `AhoraWidget.entitlements`). Para integrarlo:

1. Xcode → **File ▸ New ▸ Target… ▸ Widget Extension**. Nómbralo
   `AhoraWidget`, **desmarca** "Include Configuration Intent", finish.
2. Xcode crea archivos de plantilla: **sustitúyelos** por los de
   `ios/AhoraWidget/` de este repo (reemplaza el `AhoraWidget.swift` y el
   `Info.plist` generados por los versionados aquí).
3. Target **AhoraWidget** → **Signing & Capabilities** → **+ Capability** →
   **App Groups** → marca `group.com.nakama.ahora` (usa el
   `AhoraWidget.entitlements` incluido o deja que Xcode lo genere).
4. Build & Run del scheme **AhoraWidget** en el simulador, o añade el widget a
   la pantalla de inicio desde la app.

El widget es **systemMedium**, estático, muestra hasta 4 filas (atrasadas →
hoy → próximas), cabecera con la fecha y contador de atrasadas, y **toda su
superficie abre la app** vía `ahora://abrir` (`.widgetURL`).

---

## Comandos útiles

| Acción | Comando |
|--------|---------|
| Dev web | `npm run dev` |
| Tests | `npm test` |
| Build web | `npm run build` |
| Iconos + splash | `npm run assets` |
| Sync nativo | `npm run sync` (= `build && cap sync`) |
| Abrir/ejecutar iOS | `npm run ios` (= `build && sync ios && open ios`) |
| Abrir/ejecutar Android | `npm run android` |

---

## Criterios de aceptación

- «enviar factura el viernes urgente» → tarea **"Enviar factura"**, próximo
  viernes 09:00, prioridad **alta**. ✅ (cubierto por tests)
- Cerrar y reabrir conserva las tareas. ✅
- El parser pasa todos sus tests. ✅ (`npm test`)
- `domain/` sin imports de React ni Capacitor. ✅

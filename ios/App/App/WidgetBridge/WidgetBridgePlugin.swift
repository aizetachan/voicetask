import Foundation
import Capacitor
import WidgetKit

/// Plugin local de Capacitor: escribe el snapshot de tareas en el App Group
/// compartido con el widget y le pide recargar sus timelines.
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin {

    /// Debe coincidir con el App Group activado en los targets App y Widget.
    static let appGroup = "group.com.nakama.ahora"
    /// Clave del snapshot leída por el widget.
    static let snapshotKey = "ahora.snapshot"

    @objc func updateSnapshot(_ call: CAPPluginCall) {
        guard let json = call.getString("tasks") else {
            call.reject("Falta el parámetro 'tasks'")
            return
        }

        guard let defaults = UserDefaults(suiteName: WidgetBridgePlugin.appGroup) else {
            call.reject("No se pudo acceder al App Group \(WidgetBridgePlugin.appGroup)")
            return
        }

        defaults.set(json, forKey: WidgetBridgePlugin.snapshotKey)

        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }

        call.resolve()
    }
}

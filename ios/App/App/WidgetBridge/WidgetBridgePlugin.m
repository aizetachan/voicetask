#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Registra el plugin Swift ante Capacitor con el nombre JS "WidgetBridge".
CAP_PLUGIN(WidgetBridgePlugin, "WidgetBridge",
           CAP_PLUGIN_METHOD(updateSnapshot, CAPPluginReturnPromise);
)

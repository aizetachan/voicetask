// Añade el plugin nativo WidgetBridge (Swift + ObjC) al target App del
// proyecto Xcode, de forma idempotente. Usa la librería `xcode` (parser del
// .pbxproj) para no editar el archivo a mano.
import xcode from 'xcode';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pbxPath = resolve(root, 'ios/App/App.xcodeproj/project.pbxproj');

const proj = xcode.project(pbxPath);
proj.parseSync();

// ¿Ya están añadidos? -> no hacer nada (idempotente).
const fileRefs = proj.hash.project.objects.PBXFileReference || {};
const already = Object.values(fileRefs).some(
  (v) => typeof v === 'object' && v.path && String(v.path).includes('WidgetBridgePlugin'),
);
if (already) {
  console.log('WidgetBridge ya está cableado. Nada que hacer.');
  process.exit(0);
}

// Localiza el grupo "App" (path === 'App').
const groups = proj.hash.project.objects.PBXGroup;
let appGroupKey;
for (const key of Object.keys(groups)) {
  if (key.endsWith('_comment')) continue;
  if (groups[key] && groups[key].path === 'App') {
    appGroupKey = key;
    break;
  }
}
if (!appGroupKey) {
  console.error('No se encontró el grupo App en el proyecto.');
  process.exit(1);
}

// Crea el subgrupo WidgetBridge y lo cuelga del grupo App.
const wbGroup = proj.addPbxGroup([], 'WidgetBridge', 'WidgetBridge');
proj
  .getPBXGroupByKey(appGroupKey)
  .children.push({ value: wbGroup.uuid, comment: 'WidgetBridge' });

// Añade los archivos al subgrupo y a la fase de compilación (Sources) del target App.
// El grupo ya tiene path "WidgetBridge", así que los ficheros van por su nombre
// base (la ruta efectiva queda App/WidgetBridge/WidgetBridgePlugin.*).
const target = proj.getFirstTarget().uuid;
proj.addSourceFile('WidgetBridgePlugin.swift', { target }, wbGroup.uuid);
proj.addSourceFile('WidgetBridgePlugin.m', { target }, wbGroup.uuid);

import('node:fs').then(({ writeFileSync }) => {
  writeFileSync(pbxPath, proj.writeSync());
  console.log('WidgetBridge cableado al target App.');
});

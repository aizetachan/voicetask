// Genera las imágenes fuente (icono + splash) para @capacitor/assets.
// Marca "Ahora": fondo oscuro (#0e0f13) + check en la tinta de acento (#6ea8fe).
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'assets');
mkdirSync(out, { recursive: true });

const BG = '#0e0f13';
const ACCENT = '#6ea8fe';

// Check centrado y escalable dentro de un viewBox de 1024.
function check(strokeWidth, scale = 1) {
  const cx = 512;
  const cy = 512;
  const s = scale;
  const p = (x, y) => `${cx + (x - 512) * s} ${cy + (y - 512) * s}`;
  return `<path d="M ${p(322, 540)} L ${p(452, 670)} L ${p(710, 372)}"
      fill="none" stroke="${ACCENT}" stroke-width="${strokeWidth}"
      stroke-linecap="round" stroke-linejoin="round"/>`;
}

function svg({ size = 1024, bg, scale = 1, stroke = 92 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
    ${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''}
    ${check(stroke, scale)}
  </svg>`;
}

async function png(name, markup, size) {
  await sharp(Buffer.from(markup)).resize(size, size).png().toFile(resolve(out, name));
  console.log('✓', name);
}

await png('icon-only.png', svg({ bg: BG }), 1024);
await png('icon-background.png', `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${BG}"/></svg>`, 1024);
// Foreground adaptativo: glyph dentro de la zona segura (~62%).
await png('icon-foreground.png', svg({ bg: null, scale: 0.62, stroke: 78 }), 1024);
// Splash: glyph centrado sobre fondo oscuro.
await png('splash.png', svg({ bg: BG, scale: 0.34, stroke: 38 }), 2732);
await png('splash-dark.png', svg({ bg: BG, scale: 0.34, stroke: 38 }), 2732);

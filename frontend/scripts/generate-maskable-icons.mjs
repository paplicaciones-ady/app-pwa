// Regenera todos los iconos desde Elena-min.png con padding maskable.
// Logo se escala al 75% del tamaño final y se centra con fondo transparente.
//
// Uso: node scripts/generate-maskable-icons.mjs
// Luego: npm run build

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const iconsDir = join(publicDir, 'icons');
const src = join(publicDir, 'Elena-min.png');

const SIZES = [16, 32, 57, 72, 96, 128, 144, 152, 180, 192, 384, 512];
const LOGO_RATIO = 0.75;

if (!existsSync(src)) { console.error('Missing:', src); process.exit(1); }
if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });

const tmp = '/tmp/pwa-icons';
execSync(`mkdir -p ${tmp}`);

console.log(`Generando ${SIZES.length} iconos maskable desde Elena-min.png\n`);

for (const sz of SIZES) {
  const inner = Math.round(sz * LOGO_RATIO);
  const pad = Math.floor((sz - inner) / 2);
  execSync(
    `npx -y sharp-cli resize ${inner} ${inner} --input "${src}" --output "${tmp}/i-${sz}.png"`,
    { stdio: 'pipe' }
  );
  execSync(
    `npx -y sharp-cli extend ${pad} ${pad} ${pad} ${pad} --background transparent ` +
    `--input "${tmp}/i-${sz}.png" --output "${join(iconsDir, `icon-${sz}x${sz}.png`)}"`,
    { stdio: 'pipe' }
  );
  console.log(`  ${sz}x${sz}  (logo ${inner}px + ${pad}px pad)`);
}

execSync(`cp ${join(iconsDir, 'icon-96x96.png')}  ${join(publicDir, 'favicon-96x96.png')}`);
execSync(`cp ${join(iconsDir, 'icon-180x180.png')} ${join(publicDir, 'apple-touch-icon.png')}`);
execSync(`cp ${join(iconsDir, 'icon-32x32.png')}  ${join(publicDir, 'favicon.ico')}`);
console.log('\n✔ Root favicons actualizados');
console.log('Ejecuta: npm run build\n');

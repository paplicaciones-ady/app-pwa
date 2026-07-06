import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const iconsDir = join(root, 'public', 'icons');
const maskableSource = join(root, '..', 'favicon', 'web-app-manifest-512x512.png');

const SIZES = [16, 32, 57, 72, 96, 128, 144, 152, 180, 192, 384, 512];

if (!existsSync(maskableSource)) {
  console.error(`Source not found at ${maskableSource}`);
  process.exit(1);
}

if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });

console.log(`Using maskable-optimized source: ${maskableSource}`);

for (const size of SIZES) {
  console.log(`npx sharp-cli resize ${size} ${size} --input favicon/web-app-manifest-512x512.png --output frontend/public/icons/icon-${size}x${size}.png`);
}

console.log('\nThen run: npm run build');

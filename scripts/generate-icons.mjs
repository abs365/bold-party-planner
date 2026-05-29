// PWA icon generator — run once with: node scripts/generate-icons.mjs
// Uses sharp (Next.js transitive dep). Delete this script after running.

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'icons');

// Brand colours
const NAVY = '#0D1B3E';
const GOLD = '#C9A84C';

// Mark drawn in a 64×64 coordinate space.
// Background rect is handled separately per icon type (no rx — OS applies its own mask).
const MARK = `
  <circle cx="32" cy="36" r="18" stroke="${GOLD}" stroke-width="1.4" fill="none"/>
  <line x1="32" y1="8" x2="32" y2="16" stroke="${GOLD}" stroke-width="1.6" stroke-linecap="round"/>
  <line x1="22" y1="12" x2="24.5" y2="18.5" stroke="${GOLD}" stroke-width="1.2" stroke-linecap="round" opacity="0.65"/>
  <line x1="42" y1="12" x2="39.5" y2="18.5" stroke="${GOLD}" stroke-width="1.2" stroke-linecap="round" opacity="0.65"/>
  <text x="32" y="41" text-anchor="middle"
        font-family="Georgia,'Times New Roman',serif"
        font-weight="700" font-size="15" letter-spacing="1.5" fill="${GOLD}">EB</text>
`;

// Regular icon: full-bleed navy square, mark fills entire viewBox.
function regularSvg(px) {
  return `<svg xmlns="http://www.w3.org/2000/svg"
    width="${px}" height="${px}" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" fill="${NAVY}"/>
  ${MARK}
</svg>`;
}

// Maskable icon: 512×512, mark confined to central 80% safe zone (409.6px).
// scale = 409.6/64 = 6.4 · offset = (512-409.6)/2 = 51.2
function maskableSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg"
    width="512" height="512" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" fill="${NAVY}"/>
  <g transform="translate(51.2 51.2) scale(6.4)">
    ${MARK}
  </g>
</svg>`;
}

const REGULAR_SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];

async function run() {
  console.log('Generating PWA icons…\n');

  for (const px of REGULAR_SIZES) {
    const name = px === 180 ? 'apple-touch-icon.png' : `icon-${px}.png`;
    await sharp(Buffer.from(regularSvg(px)))
      .resize(px, px)
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT, name));
    console.log(`  ✓  ${name.padEnd(26)} ${px}×${px}`);
  }

  await sharp(Buffer.from(maskableSvg()))
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, 'icon-512-maskable.png'));
  console.log(`  ✓  icon-512-maskable.png       512×512 (maskable, 80% safe zone)`);

  console.log('\nAll icons written to public/icons/');
}

run().catch(e => { console.error(e); process.exit(1); });

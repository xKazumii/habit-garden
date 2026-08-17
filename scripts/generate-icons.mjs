/**
 * Erzeugt Favicon und PWA-Icons aus einer einzigen Quelle.
 *
 *   npm run icons
 *
 * Die Marke stammt aus dem Design-Prototyp. Die Ergebnisse liegen in public/
 * und werden mit ausgeliefert — der Build erzeugt sie nicht neu.
 */
import { Buffer } from 'node:buffer'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const HERE = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(HERE, '..')
const PUBLIC_DIR = join(PROJECT_ROOT, 'public')
const ICONS_DIR = join(PUBLIC_DIR, 'icons')

const SAGE = '#7C9885'

/** Die Marke ohne Hintergrundfläche. */
const MARK = [
  '<ellipse cx="256" cy="404" rx="132" ry="34" fill="#5F7A69"/>',
  '<path d="M124 404 Q256 320 388 404 Z" fill="#4E6656"/>',
  '<path d="M256 396 Q256 268 256 208" stroke="#FAF7F2" stroke-width="16" stroke-linecap="round" fill="none"/>',
  '<ellipse cx="200" cy="288" rx="58" ry="26" fill="#FAF7F2" transform="rotate(-20 200 288)"/>',
  '<ellipse cx="312" cy="266" rx="58" ry="26" fill="#EFE9DF" transform="rotate(20 312 266)"/>',
  '<circle cx="256" cy="180" r="34" fill="#D08C60"/>',
].join('')

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${body}</svg>`

/** Favicon und purpose "any": abgerundetes Quadrat. */
const ROUNDED = svg(`<rect width="512" height="512" rx="96" fill="${SAGE}"/>${MARK}`)

/** apple-touch-icon: randlos, iOS rundet selbst ab. */
const FULL_BLEED = svg(`<rect width="512" height="512" fill="${SAGE}"/>${MARK}`)

/**
 * purpose "maskable": Android beschneidet beliebig, wichtige Inhalte müssen
 * innerhalb eines Kreises mit 80 % der Kantenlänge liegen. Deshalb randloser
 * Hintergrund und die Marke verkleinert in der Mitte.
 */
const MASKABLE_SCALE = 0.66
const MASKABLE = svg(
  `<rect width="512" height="512" fill="${SAGE}"/>` +
    `<g transform="translate(256 256) scale(${MASKABLE_SCALE}) translate(-256 -256)">${MARK}</g>`,
)

const TARGETS = [
  { source: ROUNDED, file: join(ICONS_DIR, 'icon-192.png'), size: 192 },
  { source: ROUNDED, file: join(ICONS_DIR, 'icon-512.png'), size: 512 },
  { source: MASKABLE, file: join(ICONS_DIR, 'icon-maskable-512.png'), size: 512 },
  { source: FULL_BLEED, file: join(PUBLIC_DIR, 'apple-touch-icon.png'), size: 180 },
]

await mkdir(ICONS_DIR, { recursive: true })

const faviconPath = join(PUBLIC_DIR, 'favicon.svg')
await writeFile(faviconPath, `${ROUNDED}\n`, 'utf8')
console.log(`✓ ${relative(PROJECT_ROOT, faviconPath)}`)

for (const { source, file, size } of TARGETS) {
  await sharp(Buffer.from(source)).resize(size, size).png({ compressionLevel: 9 }).toFile(file)
  console.log(`✓ ${relative(PROJECT_ROOT, file)} (${size}px)`)
}

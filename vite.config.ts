import { readFileSync } from 'node:fs'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * KRITISCH: Das Projekt wird als Project Page unter
 * https://xkazumii.github.io/habit-garden/ ausgeliefert.
 * `base`, `start_url` und `scope` müssen identisch sein, und es darf nirgends
 * ein absoluter Asset-Pfad wie "/icons/..." stehen.
 */
const BASE_PATH = '/habit-garden/'

const APP_NAME = 'Habit Garden'
const APP_SHORT_NAME = 'Garden'
const APP_DESCRIPTION =
  'Ein digitaler Garten für deine Gewohnheiten. Jede Gewohnheit ist eine Pflanze — erledige sie, gieße sie, sieh sie wachsen.'

/** Muss zum Hintergrund der App passen, damit die Statusleiste nahtlos wirkt. */
const THEME_COLOR = '#FAF7F2'
const BACKGROUND_COLOR = '#FAF7F2'

/** Relativ zur manifest.webmanifest — dadurch bleibt der Base-Path austauschbar. */
const ICONS = [
  { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' as const },
  { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' as const },
  {
    src: 'icons/icon-maskable-512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable' as const,
  },
]

const PRECACHE_GLOB = ['**/*.{js,css,html,svg,png,ico,woff2}']

/**
 * Die Version steht nur in der package.json. Sie wird zur Bauzeit als
 * `__APP_VERSION__` eingesetzt (deklariert in src/globals.d.ts), damit die
 * Einstellungen sie anzeigen können, ohne dass eine zweite Stelle driftet.
 */
const { version: APP_VERSION } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string }

export default defineConfig({
  base: BASE_PATH,
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: BASE_PATH,
        name: APP_NAME,
        short_name: APP_SHORT_NAME,
        description: APP_DESCRIPTION,
        start_url: BASE_PATH,
        scope: BASE_PATH,
        display: 'standalone',
        orientation: 'portrait',
        lang: 'de',
        dir: 'ltr',
        theme_color: THEME_COLOR,
        background_color: BACKGROUND_COLOR,
        categories: ['lifestyle', 'productivity', 'health'],
        icons: ICONS,
      },
      workbox: {
        globPatterns: PRECACHE_GLOB,
        navigateFallback: `${BASE_PATH}index.html`,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})

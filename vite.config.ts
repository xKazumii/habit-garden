import { readFileSync } from 'node:fs'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * CRITICAL: the project ships as a project page at
 * https://xkazumii.github.io/habit-garden/
 * `base`, `start_url` and `scope` must be identical, and nowhere may there be an
 * absolute asset path such as "/icons/...".
 */
const BASE_PATH = '/habit-garden/'

const APP_NAME = 'Habit Garden'
const APP_SHORT_NAME = 'Garden'
const APP_DESCRIPTION =
  'Ein digitaler Garten für deine Gewohnheiten. Jede Gewohnheit ist eine Pflanze — erledige sie, gieße sie, sieh sie wachsen.'

/** Must match the app background so the status bar looks seamless. */
const THEME_COLOR = '#FAF7F2'
const BACKGROUND_COLOR = '#FAF7F2'

/** Relative to manifest.webmanifest — keeps the base path interchangeable. */
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
 * The version lives only in package.json. It is injected at build time as
 * `__APP_VERSION__` (declared in src/globals.d.ts) so the settings screen can
 * show it without a second place drifting out of sync.
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
      /*
       * 'prompt' rather than 'autoUpdate': the app asks before reloading. An
       * installed PWA has no reload button, so src/hooks/useAppUpdate.ts
       * registers the worker itself and surfaces a banner — hence
       * injectRegister: null, otherwise the plugin would register a second time.
       */
      registerType: 'prompt',
      injectRegister: null,
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

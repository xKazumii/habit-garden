import { defineConfig } from 'vitest/config'

/**
 * Eigene Config, damit die Tests ohne React- und PWA-Plugin laufen.
 * Die Kernlogik in src/lib ist bewusst UI- und DOM-frei.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    /*
     * Feste Zeitzone als Ausgangspunkt, damit die Kalendertag-Tests auf jeder
     * Maschine und in der CI identisch laufen. Einzelne Tests stellen
     * process.env.TZ gezielt um und setzen sie danach zurück.
     */
    env: { TZ: 'Europe/Berlin' },
  },
})

import { MAX_GARDENER_NAME_LENGTH } from '../config/settings'
import type { GardenSettings } from '../types'
import { db } from './db'

/**
 * Repository der Garten-Einstellungen. Genau eine Zeile mit fester id.
 *
 * `getSettings()` liefert immer ein Objekt — auch bevor je etwas gespeichert
 * wurde. Die Screens müssen dadurch nicht zwischen „noch nichts da" und
 * „übersprungen" unterscheiden; dafür ist `onboardedAt` zuständig.
 */

export const SETTINGS_ID = 'app'

const DEFAULT_SETTINGS: GardenSettings = {
  id: SETTINGS_ID,
  gardenerName: '',
  onboardedAt: null,
}

const normalizeName = (name: string): string =>
  name.trim().slice(0, MAX_GARDENER_NAME_LENGTH)

export const getSettings = async (): Promise<GardenSettings> =>
  (await db.settings.get(SETTINGS_ID)) ?? DEFAULT_SETTINGS

const patchSettings = async (changes: Partial<GardenSettings>): Promise<void> => {
  await db.transaction('rw', db.settings, async () => {
    const current = (await db.settings.get(SETTINGS_ID)) ?? DEFAULT_SETTINGS
    await db.settings.put({ ...current, ...changes, id: SETTINGS_ID })
  })
}

export const saveGardenerName = (name: string): Promise<void> =>
  patchSettings({ gardenerName: normalizeName(name) })

/**
 * Beantwortet die Begrüßung beim ersten Start. Ein leerer Name bedeutet
 * „übersprungen" — der Zeitstempel sorgt dafür, dass nicht erneut gefragt wird.
 */
export const completeOnboarding = (name: string, now: number = Date.now()): Promise<void> =>
  patchSettings({ gardenerName: normalizeName(name), onboardedAt: now })

import { useLiveQuery } from 'dexie-react-hooks'

import { getSettings } from '../db/settings'
import type { GardenSettings } from '../types'

/**
 * Die Garten-Einstellungen, live an IndexedDB gebunden.
 *
 * `undefined` heißt: die Datenbank hat noch nicht geantwortet. Erst danach
 * steht fest, ob die Begrüßung gezeigt werden muss — sonst würde sie bei jedem
 * Start kurz aufblitzen.
 */
export const useSettings = (): GardenSettings | undefined =>
  useLiveQuery(() => getSettings(), [])

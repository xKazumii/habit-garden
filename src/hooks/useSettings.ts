import { useLiveQuery } from 'dexie-react-hooks'

import { getSettings } from '../db/settings'
import type { GardenSettings } from '../types'

/**
 * The garden settings, bound live to IndexedDB.
 *
 * `undefined` means the database has not answered yet. Only afterwards is it
 * clear whether the greeting has to be shown — otherwise it would flash up on
 * every start.
 */
export const useSettings = (): GardenSettings | undefined =>
  useLiveQuery(() => getSettings(), [])

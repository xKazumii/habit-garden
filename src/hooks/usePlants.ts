import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'

import { listPlants } from '../db/plants'
import { derivePlants } from '../lib/growth'
import type { DerivedPlant } from '../types'

/**
 * Every plant plus its derived state, bound live to IndexedDB.
 *
 * `now` comes from outside so the whole app sees the same instant — otherwise the
 * garden could already know about a day change while the tab bar does not.
 *
 * `undefined` means the database has not answered yet. That is different from an
 * empty garden and the screens render it differently.
 */
export const usePlants = (now: number): DerivedPlant[] | undefined => {
  const stored = useLiveQuery(() => listPlants(), [])

  return useMemo(() => (stored ? derivePlants(stored, now) : undefined), [stored, now])
}

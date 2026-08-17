import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'

import { listPlants } from '../db/plants'
import { derivePlants } from '../lib/growth'
import type { DerivedPlant } from '../types'

/**
 * Alle Pflanzen samt abgeleitetem Zustand, live an IndexedDB gebunden.
 *
 * `now` kommt von außen, damit die ganze App denselben Zeitpunkt sieht — sonst
 * könnte der Garten einen Tageswechsel schon kennen und die Tab Bar noch nicht.
 *
 * `undefined` bedeutet: die Datenbank hat noch nicht geantwortet. Das ist etwas
 * anderes als ein leerer Garten und wird in den Screens auch anders dargestellt.
 */
export const usePlants = (now: number): DerivedPlant[] | undefined => {
  const stored = useLiveQuery(() => listPlants(), [])

  return useMemo(() => (stored ? derivePlants(stored, now) : undefined), [stored, now])
}

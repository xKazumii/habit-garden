import Dexie, { type EntityTable } from 'dexie'

import type { Plant } from '../types'

const DB_NAME = 'habit-garden'
const DB_VERSION = 1

/**
 * Nur `id` ist Primärschlüssel. Indiziert wird, wonach die Screens filtern und
 * sortieren. `waterings` bleibt ein einfaches Array im Datensatz — die
 * Auswertung passiert in src/lib/growth.ts, nicht in der Datenbank.
 */
const PLANT_INDEXES = 'id, createdAt, status, lastWateredAt, category'

export class HabitGardenDatabase extends Dexie {
  declare plants: EntityTable<Plant, 'id'>

  constructor() {
    super(DB_NAME)
    this.version(DB_VERSION).stores({ plants: PLANT_INDEXES })
  }
}

export const db = new HabitGardenDatabase()

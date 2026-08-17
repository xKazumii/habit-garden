import Dexie, { type EntityTable } from 'dexie'

import type { GardenSettings, Plant } from '../types'

const DB_NAME = 'habit-garden'

/**
 * Only `id` is the primary key. Indexes cover what the screens filter and sort
 * by. `waterings` stays a plain array on the record — it is evaluated in
 * src/lib/growth.ts, not in the database.
 */
const PLANT_INDEXES = 'id, createdAt, status, lastWateredAt, category'

/** Exactly one row, see `GardenSettings`. No further index needed. */
const SETTINGS_INDEXES = 'id'

export class HabitGardenDatabase extends Dexie {
  declare plants: EntityTable<Plant, 'id'>
  declare settings: EntityTable<GardenSettings, 'id'>

  constructor() {
    super(DB_NAME)

    /*
     * Earlier versions stay declared, otherwise Dexie cannot upgrade an existing
     * garden. Version 2 only adds the `settings` table — nothing changes about
     * the plants, so no migration is needed.
     */
    this.version(1).stores({ plants: PLANT_INDEXES })
    this.version(2).stores({ plants: PLANT_INDEXES, settings: SETTINGS_INDEXES })
  }
}

export const db = new HabitGardenDatabase()

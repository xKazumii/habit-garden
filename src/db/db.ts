import Dexie, { type EntityTable } from 'dexie'

import type { GardenSettings, Plant } from '../types'

const DB_NAME = 'habit-garden'

/**
 * Nur `id` ist Primärschlüssel. Indiziert wird, wonach die Screens filtern und
 * sortieren. `waterings` bleibt ein einfaches Array im Datensatz — die
 * Auswertung passiert in src/lib/growth.ts, nicht in der Datenbank.
 */
const PLANT_INDEXES = 'id, createdAt, status, lastWateredAt, category'

/** Genau eine Zeile, siehe `GardenSettings`. Kein weiterer Index nötig. */
const SETTINGS_INDEXES = 'id'

export class HabitGardenDatabase extends Dexie {
  declare plants: EntityTable<Plant, 'id'>
  declare settings: EntityTable<GardenSettings, 'id'>

  constructor() {
    super(DB_NAME)

    /*
     * Frühere Versionen bleiben deklariert, sonst kann Dexie einen bestehenden
     * Garten nicht hochziehen. Version 2 ergänzt nur die Tabelle `settings` —
     * an den Pflanzen ändert sich nichts, es braucht keine Migration.
     */
    this.version(1).stores({ plants: PLANT_INDEXES })
    this.version(2).stores({ plants: PLANT_INDEXES, settings: SETTINGS_INDEXES })
  }
}

export const db = new HabitGardenDatabase()

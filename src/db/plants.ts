import { MAX_INTERVAL_DAYS, MIN_INTERVAL_DAYS } from '../config/growth'
import { reconcileStatus, water } from '../lib/growth'
import type { NewPlantInput, Plant, StoredWaterOutcome } from '../types'
import { db } from './db'

/** Felder, die im Bearbeiten-Flow geändert werden dürfen. */
export type PlantEdit = Partial<Pick<Plant, 'habitName' | 'intervalDays'>>

const createId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `plant-${Date.now().toString(36)}-${Math.trunc(Math.random() * 1e9).toString(36)}`

const clampIntervalDays = (days: number): number => {
  if (!Number.isFinite(days)) return MIN_INTERVAL_DAYS
  return Math.min(MAX_INTERVAL_DAYS, Math.max(MIN_INTERVAL_DAYS, Math.trunc(days)))
}

export const listPlants = (): Promise<Plant[]> => db.plants.orderBy('createdAt').toArray()

export const getPlant = (id: string): Promise<Plant | undefined> => db.plants.get(id)

/** Legt eine neue Pflanze an. Sie ist ab dem Pflanztag sofort fällig. */
export const plantSeedling = async (
  input: NewPlantInput,
  now: number = Date.now(),
): Promise<Plant> => {
  const plant: Plant = {
    id: createId(),
    category: input.category,
    species: input.species,
    habitName: input.habitName.trim(),
    intervalDays: clampIntervalDays(input.intervalDays),
    createdAt: now,
    lastWateredAt: null,
    waterings: [],
    growthPoints: 0,
    status: 'alive',
  }

  await db.plants.add(plant)
  return plant
}

/**
 * Gießt eine Pflanze. Die Regel selbst liegt in src/lib/growth.ts — hier wird
 * nur gelesen, geprüft und in einer Transaktion zurückgeschrieben, damit zwei
 * schnelle Taps nicht zwei Wachstumspunkte ergeben.
 */
export const waterPlant = async (
  id: string,
  now: number = Date.now(),
): Promise<StoredWaterOutcome> =>
  db.transaction('rw', db.plants, async () => {
    const stored = await db.plants.get(id)
    if (!stored) return { ok: false, reason: 'missing' }

    const outcome = water(stored, now)
    if (!outcome.ok) {
      // Der Tod kann erst beim Lesen auffallen — dann gleich festschreiben.
      const reconciled = reconcileStatus(stored, now)
      if (reconciled !== stored) await db.plants.put(reconciled)
      return outcome
    }

    await db.plants.put(outcome.plant)
    return outcome
  })

export const editPlant = async (id: string, changes: PlantEdit): Promise<void> => {
  const patch: PlantEdit = {}
  if (changes.habitName !== undefined) patch.habitName = changes.habitName.trim()
  if (changes.intervalDays !== undefined) patch.intervalDays = clampIntervalDays(changes.intervalDays)
  if (Object.keys(patch).length === 0) return

  await db.plants.update(id, patch)
}

/** Ausgraben. Entfernt die Pflanze endgültig. */
export const uprootPlant = (id: string): Promise<void> => db.plants.delete(id)

/**
 * Übernimmt Pflanzen aus einer Sicherung.
 *
 * Zusammenführend über die id, nicht ersetzend: dieselbe Datei zweimal zu
 * importieren ändert nichts, und ein Import löscht nie etwas, das nur im
 * Browser steht. Geprüft wurde bereits in src/lib/backup.ts.
 */
export const importPlants = async (plants: readonly Plant[]): Promise<number> => {
  if (plants.length === 0) return 0

  await db.plants.bulkPut([...plants])
  return plants.length
}

/**
 * Schreibt für alle Pflanzen einen inzwischen erkannten Tod fest.
 *
 * Reine Bequemlichkeit für Abfragen — die Anzeige braucht das nicht, weil der
 * Zustand ohnehin bei jedem Render aus den Zeitstempeln berechnet wird. Wird
 * beim App-Start einmal aufgerufen.
 */
export const reconcilePlantStatuses = async (now: number = Date.now()): Promise<number> => {
  const stored = await listPlants()
  const changed = stored
    .map((plant) => reconcileStatus(plant, now))
    .filter((plant, index) => plant !== stored[index])

  if (changed.length > 0) await db.plants.bulkPut(changed)
  return changed.length
}

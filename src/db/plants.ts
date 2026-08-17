import { MAX_INTERVAL_DAYS, MIN_INTERVAL_DAYS } from '../config/growth'
import { coinsEarnedFor } from '../lib/coins'
import { reconcileStatus, water } from '../lib/growth'
import type { NewPlantInput, Plant, StoredWaterOutcome } from '../types'
import { db } from './db'
import { bankCoins } from './settings'

/** Fields the edit flow is allowed to change. */
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

/** Creates a new plant. It is due immediately from its planting day. */
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
 * Waters a plant. The rule itself lives in src/lib/growth.ts — here we only
 * read, check and write back inside a transaction, so that two quick taps do not
 * yield two growth points.
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
      // Death may only surface on read — write it down right away.
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

/**
 * Uproots. Removes the plant for good.
 *
 * Its earned coins are banked first: the earned total is derived from the
 * watering history, and that history disappears here. Without banking, the
 * balance could go negative after an uproot.
 */
export const uprootPlant = (id: string): Promise<void> =>
  db.transaction('rw', db.plants, db.settings, async () => {
    const stored = await db.plants.get(id)
    if (!stored) return

    await bankCoins(coinsEarnedFor(stored))
    await db.plants.delete(id)
  })

/**
 * Takes plants over from a backup.
 *
 * Merging by id rather than replacing: importing the same file twice changes
 * nothing, and an import never deletes anything that only exists in this
 * browser. Validation already happened in src/lib/backup.ts.
 */
export const importPlants = async (plants: readonly Plant[]): Promise<number> => {
  if (plants.length === 0) return 0

  await db.plants.bulkPut([...plants])
  return plants.length
}

/**
 * Writes down a death that has meanwhile been detected, for all plants.
 *
 * Purely a convenience for queries — the UI does not need it, because the state
 * is derived from timestamps on every render anyway. Called once at app start.
 */
export const reconcilePlantStatuses = async (now: number = Date.now()): Promise<number> => {
  const stored = await listPlants()
  const changed = stored
    .map((plant) => reconcileStatus(plant, now))
    .filter((plant, index) => plant !== stored[index])

  if (changed.length > 0) await db.plants.bulkPut(changed)
  return changed.length
}

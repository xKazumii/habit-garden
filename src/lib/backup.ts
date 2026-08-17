/**
 * Backup as a JSON file.
 *
 * The data lives in this browser only — clearing storage clears the garden.
 * Export and import are therefore not a convenience but the only way to keep the
 * history.
 *
 * Like the rest of `lib/`, free of UI and database ties: this module only
 * converts and validates, writing happens in src/db/plants.ts.
 */

import { MAX_INTERVAL_DAYS, MIN_INTERVAL_DAYS } from '../config/growth'
import { speciesById } from '../config/species'
import type { Plant, PlantStatus } from '../types'

export const BACKUP_APP = 'habit-garden'
export const BACKUP_VERSION = 1

export interface BackupFile {
  app: string
  version: number
  exportedAt: number
  plants: Plant[]
  /**
   * Optional so that older backups without this field still import cleanly. The
   * theme deliberately is NOT part of it — it belongs to the device.
   */
  settings?: { gardenerName: string }
}

export interface ParsedBackup {
  plants: Plant[]
  /** Records that did not survive validation. */
  skipped: number
  /** `null` when the file carries no usable name. */
  gardenerName: string | null
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const clampIntervalDays = (days: number): number =>
  Math.min(MAX_INTERVAL_DAYS, Math.max(MIN_INTERVAL_DAYS, Math.trunc(days)))

const pad = (value: number): string => String(value).padStart(2, '0')

export const createBackup = (
  plants: readonly Plant[],
  gardenerName: string,
  now: number,
): BackupFile => ({
  app: BACKUP_APP,
  version: BACKUP_VERSION,
  exportedAt: now,
  plants: [...plants],
  settings: { gardenerName },
})

export const backupFileName = (now: number): string => {
  const date = new Date(now)
  return `${BACKUP_APP}-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`
}

/**
 * Validates a single record.
 *
 * Strict about everything that cannot be repaired (id, species, name, planting
 * date), lenient about the rest: a missing interval is clamped, missing points
 * are derived from the waterings.
 *
 * The category deliberately comes from the species definition rather than from
 * the file — otherwise a tampered backup could grow an oak as a herb.
 */
const parsePlant = (input: unknown): Plant | null => {
  if (typeof input !== 'object' || input === null) return null
  const record = input as Record<string, unknown>

  const { id, species, habitName, createdAt } = record
  if (typeof id !== 'string' || id.length === 0) return null
  if (typeof species !== 'string') return null
  if (typeof habitName !== 'string' || habitName.trim().length === 0) return null
  if (!isFiniteNumber(createdAt)) return null

  const definition = speciesById(species)
  if (!definition) return null

  const waterings = Array.isArray(record.waterings)
    ? record.waterings.filter(isFiniteNumber).sort((left, right) => left - right)
    : []

  const status: PlantStatus = record.status === 'dead' ? 'dead' : 'alive'

  return {
    id,
    category: definition.category,
    species,
    habitName: habitName.trim(),
    intervalDays: isFiniteNumber(record.intervalDays)
      ? clampIntervalDays(record.intervalDays)
      : MIN_INTERVAL_DAYS,
    createdAt,
    lastWateredAt: isFiniteNumber(record.lastWateredAt)
      ? record.lastWateredAt
      : (waterings.at(-1) ?? null),
    waterings,
    growthPoints: isFiniteNumber(record.growthPoints)
      ? Math.max(0, Math.trunc(record.growthPoints))
      : waterings.length,
    status,
  }
}

/**
 * The name from the backup, if usable.
 * An empty name in the file must not overwrite an existing one — so it already
 * counts as "absent" here.
 */
const parseGardenerName = (settings: unknown): string | null => {
  if (typeof settings !== 'object' || settings === null) return null

  const { gardenerName } = settings as Record<string, unknown>
  if (typeof gardenerName !== 'string') return null

  const trimmed = gardenerName.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Reads a backup. `null` means: this is not a backup of this app.
 * Individual broken records do not sink the whole import — they are counted and
 * skipped.
 */
export const parseBackup = (raw: string): ParsedBackup | null => {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null
  const file = parsed as Record<string, unknown>
  if (file.app !== BACKUP_APP) return null
  if (!Array.isArray(file.plants)) return null

  const plants: Plant[] = []
  let skipped = 0

  for (const entry of file.plants) {
    const plant = parsePlant(entry)
    if (plant) plants.push(plant)
    else skipped += 1
  }

  return { plants, skipped, gardenerName: parseGardenerName(file.settings) }
}

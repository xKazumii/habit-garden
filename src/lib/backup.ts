/**
 * Sicherung als JSON-Datei.
 *
 * Die Daten liegen ausschließlich im Browser — wer den Speicher löscht, löscht
 * den Garten. Export und Import sind deshalb kein Komfort, sondern die einzige
 * Möglichkeit, die Historie zu behalten.
 *
 * Wie der Rest von `lib/` ohne UI- und Datenbank-Bezug: hier wird nur
 * umgewandelt und geprüft, geschrieben wird in src/db/plants.ts.
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
   * Optional, damit ältere Sicherungen ohne dieses Feld weiterhin sauber
   * einlesen. Das Theme steht bewusst NICHT drin — es gehört zum Gerät.
   */
  settings?: { gardenerName: string }
}

export interface ParsedBackup {
  plants: Plant[]
  /** Datensätze, die die Prüfung nicht überstanden haben. */
  skipped: number
  /** `null`, wenn die Datei keinen brauchbaren Namen mitbringt. */
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
 * Prüft einen einzelnen Datensatz.
 *
 * Streng bei allem, was sich nicht reparieren lässt (Id, Art, Name, Pflanzdatum),
 * nachsichtig bei allem anderen: ein fehlendes Intervall wird geklemmt, fehlende
 * Punkte werden aus den Gießvorgängen abgeleitet.
 *
 * Die Kategorie kommt bewusst aus der Artdefinition und nicht aus der Datei —
 * sonst könnte eine manipulierte Sicherung eine Eiche als Kraut wachsen lassen.
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
 * Der Name aus der Sicherung, sofern brauchbar.
 * Ein leerer Name in der Datei soll einen vorhandenen nicht überschreiben —
 * deshalb zählt er hier bereits als „nicht vorhanden".
 */
const parseGardenerName = (settings: unknown): string | null => {
  if (typeof settings !== 'object' || settings === null) return null

  const { gardenerName } = settings as Record<string, unknown>
  if (typeof gardenerName !== 'string') return null

  const trimmed = gardenerName.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Liest eine Sicherung. `null` heißt: das ist keine Sicherung dieser App.
 * Einzelne kaputte Datensätze kippen dagegen nicht den ganzen Import — sie
 * werden gezählt und übersprungen.
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

/**
 * Die Heatmap der letzten acht Wochen.
 *
 * Wie die gesamte Wachstumslogik rein aus Zeitstempeln gerechnet, ohne Timer
 * und ohne UI-Bezug. Für jeden Kalendertag im Fenster wird rekonstruiert, wie
 * die Pflanze an dem Tag dastand — bewertet mit derselben
 * `missedIntervalsFor()`, die auch Gesundheit und Streak bestimmt. Dadurch kann
 * die Heatmap gar nicht erst eine eigene Wahrheit erfinden.
 */

import { HEATMAP_DAYS } from '../config/heatmap'
import type { Plant } from '../types'
import { missedIntervalsFor, safeIntervalDays } from './growth'
import { dayNumber } from './time'

/**
 * `watered`  an dem Tag wurde gegossen
 * `idle`     nichts fällig, oder fällig und noch in der Karenz
 * `missed`   über die Karenz hinaus fällig und nicht gegossen
 * `before`   der Tag liegt vor dem Anpflanzen
 */
export type HeatLevel = 'watered' | 'idle' | 'missed' | 'before'

export interface HeatCell {
  /** Fortlaufende Nummer des lokalen Kalendertags, siehe `dayNumber()`. */
  day: number
  level: HeatLevel
}

export interface Heatmap {
  /** Genau `HEATMAP_DAYS` Zellen, aufsteigend. Die letzte ist heute. */
  cells: HeatCell[]
  /**
   * Anteil der Tage seit dem Anpflanzen, an denen die Pflanze versorgt war
   * (gegossen oder nichts fällig). `null`, solange es keinen Tag zu bewerten
   * gibt — etwa bei einem Anpflanzdatum in der Zukunft.
   */
  rate: number | null
}

/** Letzter Gießtag an oder vor `day`. `null`, wenn es noch keinen gab. */
const lastWateringUpTo = (wateringDays: readonly number[], day: number): number | null => {
  for (let index = wateringDays.length - 1; index >= 0; index -= 1) {
    const candidate = wateringDays[index]
    if (candidate !== undefined && candidate <= day) return candidate
  }
  return null
}

export const buildHeatmap = (plant: Plant, now: number = Date.now()): Heatmap => {
  const intervalDays = safeIntervalDays(plant.intervalDays)
  const today = dayNumber(now)
  const firstDay = today - HEATMAP_DAYS + 1
  const createdDay = dayNumber(plant.createdAt)

  const wateringDays = [...new Set(plant.waterings.map(dayNumber))].sort(
    (left, right) => left - right,
  )
  const watered = new Set(wateringDays)

  const cells: HeatCell[] = []
  let tracked = 0
  let cared = 0

  for (let day = firstDay; day <= today; day += 1) {
    if (day < createdDay) {
      cells.push({ day, level: 'before' })
      continue
    }

    tracked += 1

    if (watered.has(day)) {
      cared += 1
      cells.push({ day, level: 'watered' })
      continue
    }

    /*
     * Der Fälligkeitstag *aus Sicht dieses Tages*: das letzte Gießen davor plus
     * Intervall — oder, wenn nie gegossen wurde, der Pflanztag.
     */
    const previous = lastWateringUpTo(wateringDays, day)
    const dueDay = previous === null ? createdDay : previous + intervalDays
    const isOverdue = missedIntervalsFor(day - dueDay, intervalDays) > 0

    if (isOverdue) {
      cells.push({ day, level: 'missed' })
    } else {
      cared += 1
      cells.push({ day, level: 'idle' })
    }
  }

  return { cells, rate: tracked === 0 ? null : cared / tracked }
}

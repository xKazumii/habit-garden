/**
 * The heatmap of the last eight weeks.
 *
 * Like all the growth logic, computed purely from timestamps, without timers and
 * without UI ties. For every calendar day in the window it reconstructs how the
 * plant stood on that day — judged by the same `missedIntervalsFor()` that
 * drives health and streak. That way the heatmap cannot invent a truth of its
 * own.
 */

import { HEATMAP_DAYS } from '../config/heatmap'
import type { Plant } from '../types'
import { missedIntervalsFor, safeIntervalDays } from './growth'
import { dayNumber } from './time'

/**
 * `watered`  watered on that day
 * `idle`     nothing due, or due and still within the grace period
 * `missed`   due beyond the grace period and not watered
 * `before`   the day lies before planting
 */
export type HeatLevel = 'watered' | 'idle' | 'missed' | 'before'

export interface HeatCell {
  /** Running number of the local calendar day, see `dayNumber()`. */
  day: number
  level: HeatLevel
}

export interface Heatmap {
  /** Exactly `HEATMAP_DAYS` cells, ascending. The last one is today. */
  cells: HeatCell[]
  /**
   * Share of the days since planting on which the plant was cared for (watered
   * or nothing due). `null` while there is no day to judge — for instance with a
   * planting date in the future.
   */
  rate: number | null
}

/** Last watering day on or before `day`. `null` if there was none yet. */
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
     * The due day *as seen from this day*: the last watering before it plus the
     * interval — or, if it was never watered, the planting day.
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

import { describe, expect, it } from 'vitest'

import { HEATMAP_DAYS } from '../config/heatmap'
import type { Plant } from '../types'
import { buildHeatmap, type HeatLevel } from './heatmap'
import { dayNumber } from './time'

/** Timestamp from local calendar fields. Month is 1-based to keep tests readable. */
const local = (year: number, month: number, day: number, hour = 12): number =>
  new Date(year, month - 1, day, hour, 0, 0, 0).getTime()

const JUNE_1 = local(2026, 6, 1, 9)

const makePlant = (overrides: Partial<Plant> = {}): Plant => ({
  id: 'p1',
  category: 'herb',
  species: 'basil',
  habitName: 'Morgens zwei Gläser Wasser',
  intervalDays: 1,
  createdAt: JUNE_1,
  lastWateredAt: null,
  waterings: [],
  growthPoints: 0,
  status: 'alive',
  ...overrides,
})

/** A plant watered on the given days in June. */
const wateredOnJune = (days: readonly number[], overrides: Partial<Plant> = {}): Plant => {
  const waterings = days.map((day) => local(2026, 6, day, 9))
  return makePlant({
    lastWateredAt: waterings.at(-1) ?? null,
    waterings,
    growthPoints: waterings.length,
    ...overrides,
  })
}

/** Level of the cell for a given calendar day. */
const levelOn = (plant: Plant, now: number, day: number): HeatLevel | undefined =>
  buildHeatmap(plant, now).cells.find((cell) => cell.day === dayNumber(day))?.level

describe('buildHeatmap', () => {
  it('returns exactly eight weeks and ends today', () => {
    const now = local(2026, 6, 20)
    const { cells } = buildHeatmap(makePlant(), now)

    expect(cells).toHaveLength(HEATMAP_DAYS)
    expect(cells.at(-1)?.day).toBe(dayNumber(now))
    expect(cells[0]?.day).toBe(dayNumber(now) - HEATMAP_DAYS + 1)
  })

  it('returns the cells ascending without gaps', () => {
    const { cells } = buildHeatmap(makePlant(), local(2026, 6, 20))

    cells.forEach((cell, index) => {
      if (index === 0) return
      expect(cell.day).toBe((cells[index - 1]?.day ?? 0) + 1)
    })
  })

  it('marks days before planting as before', () => {
    const now = local(2026, 6, 10)

    expect(levelOn(makePlant(), now, local(2026, 5, 31))).toBe('before')
    expect(levelOn(makePlant(), now, JUNE_1)).not.toBe('before')
  })

  it('marks watering days as watered', () => {
    const plant = wateredOnJune([1, 2, 3])
    const now = local(2026, 6, 3, 20)

    expect(levelOn(plant, now, local(2026, 6, 2))).toBe('watered')
  })

  it('lets the due day itself pass as idle', () => {
    /*
     * Daily, last watered on the 1st: due on the 2nd. At interval 1 the grace
     * period is exactly that single day — from the 3rd on it costs health.
     */
    const plant = wateredOnJune([1])
    const now = local(2026, 6, 3, 20)

    expect(levelOn(plant, now, local(2026, 6, 2))).toBe('idle')
  })

  it('marks days beyond the grace period as missed', () => {
    const plant = wateredOnJune([1])
    const now = local(2026, 6, 6, 20)

    expect(levelOn(plant, now, local(2026, 6, 3))).toBe('missed')
    expect(levelOn(plant, now, local(2026, 6, 4))).toBe('missed')
    expect(levelOn(plant, now, local(2026, 6, 5))).toBe('missed')
  })

  it('judges every day from that day, not from today', () => {
    /*
     * A gap from the 1st to the 10th, then daily again. In hindsight the 5th
     * must read as missed, even though the plant is healthy again today.
     */
    const plant = wateredOnJune([1, 10, 11, 12])
    const now = local(2026, 6, 12, 20)

    expect(levelOn(plant, now, local(2026, 6, 5))).toBe('missed')
    expect(levelOn(plant, now, local(2026, 6, 11))).toBe('watered')
  })

  it('uses the planting day as the due day for a plant never watered', () => {
    const now = local(2026, 6, 6, 20)

    // Due immediately from the planting day, missed from the next day on.
    expect(levelOn(makePlant(), now, JUNE_1)).toBe('idle')
    expect(levelOn(makePlant(), now, local(2026, 6, 2))).toBe('missed')
  })

  it('translates a longer interval into grace and arrears correctly', () => {
    // Every 7 days, last on the 1st: due on the 8th, grace until the 14th, missed from the 15th.
    const plant = wateredOnJune([1], { intervalDays: 7 })
    const now = local(2026, 6, 20, 20)

    expect(levelOn(plant, now, local(2026, 6, 10))).toBe('idle')
    expect(levelOn(plant, now, local(2026, 6, 14))).toBe('idle')
    expect(levelOn(plant, now, local(2026, 6, 15))).toBe('missed')
  })

  it('counts several waterings on the same day as one day', () => {
    const plant = makePlant({
      waterings: [local(2026, 6, 1, 8), local(2026, 6, 1, 20)],
      lastWateredAt: local(2026, 6, 1, 20),
      growthPoints: 2,
    })
    const now = local(2026, 6, 1, 22)

    const watered = buildHeatmap(plant, now).cells.filter((cell) => cell.level === 'watered')
    expect(watered).toHaveLength(1)
  })

  describe('rate', () => {
    it('is 1 while nothing was missed', () => {
      const plant = wateredOnJune([1, 2, 3])
      expect(buildHeatmap(plant, local(2026, 6, 3, 20)).rate).toBe(1)
    })

    it('counts only days from planting on', () => {
      // Planted and watered on the 1st, today is the 2nd and still within grace.
      const plant = wateredOnJune([1])
      expect(buildHeatmap(plant, local(2026, 6, 2, 20)).rate).toBe(1)
    })

    it('drops with every missed day', () => {
      // Watered on the 1st, grace on the 2nd, 3rd to 5th missed → 2 of 5 days cared for.
      const plant = wateredOnJune([1])
      expect(buildHeatmap(plant, local(2026, 6, 5, 20)).rate).toBeCloseTo(2 / 5)
    })

    it('is null while there is no day to judge', () => {
      const plant = makePlant({ createdAt: local(2026, 6, 20) })
      expect(buildHeatmap(plant, local(2026, 6, 10)).rate).toBeNull()
    })
  })
})

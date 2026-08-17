import { describe, expect, it } from 'vitest'

import { HEATMAP_DAYS } from '../config/heatmap'
import type { Plant } from '../types'
import { buildHeatmap, type HeatLevel } from './heatmap'
import { dayNumber } from './time'

/** Zeitstempel aus lokalen Kalenderfeldern. Monat 1-basiert, damit Tests lesbar bleiben. */
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

/** Pflanze, die an den genannten Junitagen gegossen wurde. */
const wateredOnJune = (days: readonly number[], overrides: Partial<Plant> = {}): Plant => {
  const waterings = days.map((day) => local(2026, 6, day, 9))
  return makePlant({
    lastWateredAt: waterings.at(-1) ?? null,
    waterings,
    growthPoints: waterings.length,
    ...overrides,
  })
}

/** Zustand der Zelle eines bestimmten Kalendertags. */
const levelOn = (plant: Plant, now: number, day: number): HeatLevel | undefined =>
  buildHeatmap(plant, now).cells.find((cell) => cell.day === dayNumber(day))?.level

describe('buildHeatmap', () => {
  it('liefert genau acht Wochen und endet heute', () => {
    const now = local(2026, 6, 20)
    const { cells } = buildHeatmap(makePlant(), now)

    expect(cells).toHaveLength(HEATMAP_DAYS)
    expect(cells.at(-1)?.day).toBe(dayNumber(now))
    expect(cells[0]?.day).toBe(dayNumber(now) - HEATMAP_DAYS + 1)
  })

  it('gibt die Zellen lückenlos aufsteigend zurück', () => {
    const { cells } = buildHeatmap(makePlant(), local(2026, 6, 20))

    cells.forEach((cell, index) => {
      if (index === 0) return
      expect(cell.day).toBe((cells[index - 1]?.day ?? 0) + 1)
    })
  })

  it('markiert Tage vor dem Anpflanzen als before', () => {
    const now = local(2026, 6, 10)

    expect(levelOn(makePlant(), now, local(2026, 5, 31))).toBe('before')
    expect(levelOn(makePlant(), now, JUNE_1)).not.toBe('before')
  })

  it('markiert Gießtage als watered', () => {
    const plant = wateredOnJune([1, 2, 3])
    const now = local(2026, 6, 3, 20)

    expect(levelOn(plant, now, local(2026, 6, 2))).toBe('watered')
  })

  it('lässt den Fälligkeitstag selbst als idle durchgehen', () => {
    /*
     * Täglich, zuletzt am 1. gegossen: am 2. fällig. Die Karenz ist bei
     * Intervall 1 genau dieser eine Tag — ab dem 3. kostet es Gesundheit.
     */
    const plant = wateredOnJune([1])
    const now = local(2026, 6, 3, 20)

    expect(levelOn(plant, now, local(2026, 6, 2))).toBe('idle')
  })

  it('markiert Tage jenseits der Karenz als missed', () => {
    const plant = wateredOnJune([1])
    const now = local(2026, 6, 6, 20)

    expect(levelOn(plant, now, local(2026, 6, 3))).toBe('missed')
    expect(levelOn(plant, now, local(2026, 6, 4))).toBe('missed')
    expect(levelOn(plant, now, local(2026, 6, 5))).toBe('missed')
  })

  it('bewertet jeden Tag aus der Sicht dieses Tages, nicht aus heutiger', () => {
    /*
     * Lücke vom 1. bis zum 10., danach wieder täglich. Der 5. muss rückblickend
     * als verpasst dastehen, obwohl die Pflanze heute wieder gesund ist.
     */
    const plant = wateredOnJune([1, 10, 11, 12])
    const now = local(2026, 6, 12, 20)

    expect(levelOn(plant, now, local(2026, 6, 5))).toBe('missed')
    expect(levelOn(plant, now, local(2026, 6, 11))).toBe('watered')
  })

  it('kennt bei einer nie gegossenen Pflanze den Pflanztag als Fälligkeit', () => {
    const now = local(2026, 6, 6, 20)

    // Sofort ab dem Pflanztag fällig, ab dem Folgetag verpasst.
    expect(levelOn(makePlant(), now, JUNE_1)).toBe('idle')
    expect(levelOn(makePlant(), now, local(2026, 6, 2))).toBe('missed')
  })

  it('rechnet ein längeres Intervall korrekt in Karenz und Rückstand um', () => {
    // Alle 7 Tage, zuletzt am 1.: fällig am 8., Karenz bis 14., ab dem 15. verpasst.
    const plant = wateredOnJune([1], { intervalDays: 7 })
    const now = local(2026, 6, 20, 20)

    expect(levelOn(plant, now, local(2026, 6, 10))).toBe('idle')
    expect(levelOn(plant, now, local(2026, 6, 14))).toBe('idle')
    expect(levelOn(plant, now, local(2026, 6, 15))).toBe('missed')
  })

  it('zählt mehrfaches Gießen am selben Tag als einen Tag', () => {
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
    it('ist 1, solange nichts verpasst wurde', () => {
      const plant = wateredOnJune([1, 2, 3])
      expect(buildHeatmap(plant, local(2026, 6, 3, 20)).rate).toBe(1)
    })

    it('zählt nur Tage ab dem Anpflanzen', () => {
      // Am 1. gepflanzt und gegossen, heute ist der 2. und noch in der Karenz.
      const plant = wateredOnJune([1])
      expect(buildHeatmap(plant, local(2026, 6, 2, 20)).rate).toBe(1)
    })

    it('sinkt mit jedem verpassten Tag', () => {
      // 1. gegossen, 2. noch Karenz, 3. bis 5. verpasst → 2 von 5 Tagen versorgt.
      const plant = wateredOnJune([1])
      expect(buildHeatmap(plant, local(2026, 6, 5, 20)).rate).toBeCloseTo(2 / 5)
    })

    it('ist null, wenn es noch keinen Tag zu bewerten gibt', () => {
      const plant = makePlant({ createdAt: local(2026, 6, 20) })
      expect(buildHeatmap(plant, local(2026, 6, 10)).rate).toBeNull()
    })
  })
})

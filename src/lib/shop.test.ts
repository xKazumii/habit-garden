import { describe, expect, it } from 'vitest'

import { SPECIES, STARTER_SPECIES_IDS, priceOf } from '../config/species'
import type { GardenSettings, Plant } from '../types'
import { TOTAL_SPECIES_COUNT, isUnlocked, unlockedCount, unlockedSpeciesIds } from './shop'

const JUNE_1 = new Date(2026, 5, 1, 9).getTime()

const makeSettings = (overrides: Partial<GardenSettings> = {}): GardenSettings => ({
  id: 'app',
  gardenerName: '',
  onboardedAt: JUNE_1,
  bankedCoins: 0,
  purchases: [],
  ...overrides,
})

const makePlant = (species: string): Plant => ({
  id: `p-${species}`,
  category: 'herb',
  species,
  habitName: 'Lesen',
  intervalDays: 1,
  createdAt: JUNE_1,
  lastWateredAt: null,
  waterings: [],
  growthPoints: 0,
  status: 'alive',
})

describe('species catalogue', () => {
  it('has thirty species, ten per category', () => {
    expect(TOTAL_SPECIES_COUNT).toBe(30)
    expect(SPECIES.filter((s) => s.category === 'herb')).toHaveLength(10)
    expect(SPECIES.filter((s) => s.category === 'flower')).toHaveLength(10)
    expect(SPECIES.filter((s) => s.category === 'tree')).toHaveLength(10)
  })

  it('starts with six species, two per category', () => {
    expect(STARTER_SPECIES_IDS).toEqual([
      'parsley',
      'mint',
      'daisy',
      'sunflower',
      'oak',
      'birch',
    ])
  })

  it('hands out no duplicate ids', () => {
    expect(new Set(SPECIES.map((s) => s.id)).size).toBe(SPECIES.length)
  })

  it('is sorted by ascending price within each category', () => {
    // The shop shows the order from SPECIES — it should stay readable.
    for (const category of ['herb', 'flower', 'tree'] as const) {
      const prices = SPECIES.filter((s) => s.category === category).map((s) => s.price)
      expect(prices).toEqual([...prices].sort((left, right) => left - right))
    }
  })

  it('keeps to the calibration: 24 purchasable species for 2455 coins', () => {
    const purchasable = SPECIES.filter((s) => s.price > 0)
    expect(purchasable).toHaveLength(24)
    expect(purchasable.reduce((sum, s) => sum + s.price, 0)).toBe(2455)
  })

  it('knows the price of a species and reports unknown ones', () => {
    expect(priceOf('lavender')).toBe(175)
    expect(priceOf('parsley')).toBe(0)
    expect(priceOf('drachenbaum')).toBeUndefined()
  })
})

describe('unlockedSpeciesIds', () => {
  it('contains the starter species from the beginning', () => {
    const unlocked = unlockedSpeciesIds(makeSettings(), [])

    STARTER_SPECIES_IDS.forEach((id) => expect(unlocked.has(id)).toBe(true))
    expect(unlocked.has('lavender')).toBe(false)
  })

  it('contains purchased species', () => {
    const settings = makeSettings({
      purchases: [{ speciesId: 'lavender', price: 175, unlockedAt: JUNE_1 }],
    })

    expect(isUnlocked('lavender', settings, [])).toBe(true)
  })

  it('contains species that already have a plant', () => {
    /*
     * Safeguard against an imported backup: a growing plant must never count as
     * locked.
     */
    expect(isUnlocked('ginkgo', makeSettings(), [makePlant('ginkgo')])).toBe(true)
  })

  it('does not lose an unlock through uprooting', () => {
    const settings = makeSettings({
      purchases: [{ speciesId: 'tulip', price: 160, unlockedAt: JUNE_1 }],
    })

    // No plants left, the purchase remains.
    expect(isUnlocked('tulip', settings, [])).toBe(true)
  })
})

describe('unlockedCount', () => {
  it('counts the starter species at the beginning', () => {
    expect(unlockedCount(makeSettings(), [])).toBe(STARTER_SPECIES_IDS.length)
  })

  it('does not count an unknown species', () => {
    // Otherwise a foreign backup could push progress past 100 %.
    const count = unlockedCount(makeSettings(), [makePlant('drachenbaum')])
    expect(count).toBe(STARTER_SPECIES_IDS.length)
  })

  it('counts every species only once', () => {
    const plants = [makePlant('oak'), makePlant('oak')]
    expect(unlockedCount(makeSettings(), plants)).toBe(STARTER_SPECIES_IDS.length)
  })
})

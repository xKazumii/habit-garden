import { describe, expect, it } from 'vitest'

import { COINS_PER_WATERING, REPEATING_BONUS, STREAK_BONUSES } from '../config/economy'
import type { GardenSettings, Plant } from '../types'
import { bonusForStreak, coinBalance, coinsEarnedFor, coinsSpent } from './coins'

/** Timestamp from local calendar fields. Month is 1-based to keep tests readable. */
const local = (year: number, month: number, day: number, hour = 9): number =>
  new Date(year, month - 1, day, hour, 0, 0, 0).getTime()

const JUNE_1 = local(2026, 6, 1)

const makePlant = (overrides: Partial<Plant> = {}): Plant => ({
  id: 'p1',
  category: 'herb',
  species: 'parsley',
  habitName: 'Morgens zwei Gläser Wasser',
  intervalDays: 1,
  createdAt: JUNE_1,
  lastWateredAt: null,
  waterings: [],
  growthPoints: 0,
  status: 'alive',
  ...overrides,
})

const makeSettings = (overrides: Partial<GardenSettings> = {}): GardenSettings => ({
  id: 'app',
  gardenerName: '',
  onboardedAt: JUNE_1,
  bankedCoins: 0,
  purchases: [],
  ...overrides,
})

/**
 * A plant with `count` waterings spaced `everyDays` days apart, starting
 * 1 June.
 */
const wateredEvery = (count: number, everyDays = 1, intervalDays = everyDays): Plant => {
  const waterings = Array.from({ length: count }, (_unused, index) => {
    const date = new Date(JUNE_1)
    date.setDate(date.getDate() + index * everyDays)
    return date.getTime()
  })

  return makePlant({
    intervalDays,
    waterings,
    lastWateredAt: waterings.at(-1) ?? null,
    growthPoints: count,
  })
}

describe('bonusForStreak', () => {
  it('pays nothing below the first milestone', () => {
    expect(bonusForStreak(0)).toBe(0)
    expect(bonusForStreak(6)).toBe(0)
  })

  it('pays out every milestone from the table that was reached', () => {
    expect(bonusForStreak(7)).toBe(5)
    expect(bonusForStreak(13)).toBe(5)
    expect(bonusForStreak(14)).toBe(15)
    expect(bonusForStreak(30)).toBe(40)
    expect(bonusForStreak(60)).toBe(90)
    expect(bonusForStreak(100)).toBe(190)
  })

  it('does not run dry beyond the last milestone', () => {
    const atLast = bonusForStreak(100)
    expect(bonusForStreak(199)).toBe(atLast)
    expect(bonusForStreak(200)).toBe(atLast + REPEATING_BONUS.coins)
    expect(bonusForStreak(300)).toBe(atLast + 2 * REPEATING_BONUS.coins)
  })

  it('covers the whole table', () => {
    // Trips when someone adds a milestone without adjusting the tests.
    const sum = STREAK_BONUSES.reduce((total, bonus) => total + bonus.coins, 0)
    const last = STREAK_BONUSES.at(-1)
    expect(last).toBeDefined()
    expect(bonusForStreak(last?.at ?? 0)).toBe(sum)
  })
})

describe('coinsEarnedFor', () => {
  it('pays one coin per watering', () => {
    expect(coinsEarnedFor(wateredEvery(5))).toBe(5 * COINS_PER_WATERING)
  })

  it('gives nothing for a plant that was never watered', () => {
    expect(coinsEarnedFor(makePlant())).toBe(0)
  })

  it('adds the streak bonus on top', () => {
    // 7 waterings in a row: 7 coins plus the milestone at 7.
    expect(coinsEarnedFor(wateredEvery(7))).toBe(7 + 5)
  })

  it('counts an interrupted run as two runs', () => {
    /*
     * Ten daily days, then a five-day gap, then eight days.
     * First run 10 (bonus 5), second run 8 (bonus 5) — not a single run of 18.
     */
    const first = Array.from({ length: 10 }, (_u, index) => local(2026, 6, 1 + index))
    const second = Array.from({ length: 8 }, (_u, index) => local(2026, 6, 16 + index))
    const plant = makePlant({
      waterings: [...first, ...second],
      lastWateredAt: second.at(-1) ?? null,
    })

    expect(coinsEarnedFor(plant)).toBe(18 + 5 + 5)
  })

  it('keeps the bonus of a broken run', () => {
    // 14 days in a row, then a break: the bonuses for 7 and 14 stay earned.
    const run = Array.from({ length: 14 }, (_u, index) => local(2026, 6, 1 + index))
    const late = local(2026, 7, 20)
    const plant = makePlant({ waterings: [...run, late], lastWateredAt: late })

    expect(coinsEarnedFor(plant)).toBe(15 + 15)
  })

  it('treats a weekly rhythm like a daily one', () => {
    // Equal work, equal pay: seven waterings are seven waterings.
    expect(coinsEarnedFor(wateredEvery(7, 7))).toBe(coinsEarnedFor(wateredEvery(7, 1)))
  })

  it('keeps the run as long as the gap costs no health', () => {
    /*
     * Weekly, but watered every eight days: one day late at interval 7 stays
     * below a missed interval. Costs no health, so it costs no streak either.
     */
    expect(coinsEarnedFor(wateredEvery(7, 8, 7))).toBe(7 + 5)
  })

  it('breaks the run as soon as the gap costs health', () => {
    /*
     * Daily, but only watered every other day. At interval 1 the grace period is
     * exactly the due day — one day late already counts as a missed interval. No
     * bonus.
     */
    expect(coinsEarnedFor(wateredEvery(7, 2, 1))).toBe(7)
  })
})

describe('coinBalance', () => {
  it('is earned plus banked minus spent', () => {
    const plants = [wateredEvery(5)]
    const settings = makeSettings({
      bankedCoins: 12,
      purchases: [{ speciesId: 'basil', price: 15, unlockedAt: JUNE_1 }],
    })

    expect(coinsSpent(settings)).toBe(15)
    expect(coinBalance(plants, settings)).toBe(5 + 12 - 15)
  })

  it('uses the stored price, not the current one', () => {
    // A later price change must not shift existing balances.
    const settings = makeSettings({
      purchases: [{ speciesId: 'basil', price: 999, unlockedAt: JUNE_1 }],
    })

    expect(coinsSpent(settings)).toBe(999)
  })

  it('sums across all plants', () => {
    const plants = [wateredEvery(3), wateredEvery(4)]
    expect(coinBalance(plants, makeSettings())).toBe(7)
  })
})

/*
 * The calibration of the system in numbers. These tests pin the balance down:
 * change the bonuses and you immediately see what it does to the pace.
 */
describe('calibration: four daily habits, watered consistently', () => {
  const gardenAfter = (days: number): Plant[] =>
    Array.from({ length: 4 }, (_unused, index) => ({
      ...wateredEvery(days),
      id: `p${index}`,
    }))

  const balanceAfter = (days: number): number => coinBalance(gardenAfter(days), makeSettings())

  it('reaches the first seed (15 coins) on day 7', () => {
    expect(balanceAfter(7)).toBe(48)
  })

  it.each([
    [30, 280],
    [60, 600],
    [100, 1160],
  ])('after %i days holds %i coins', (days, expected) => {
    expect(balanceAfter(days)).toBe(expected)
  })
})

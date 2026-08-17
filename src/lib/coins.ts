/**
 * The coin economy — computed, not booked.
 *
 * Like health, stage and streak, the earned total follows from the watering
 * history. No event ever grants coins, so there is no double-granting and
 * nothing to reconcile after an import.
 *
 *   balance = earned(all waterings) + banked − sum of purchases
 *
 * Only what cannot be derived is persisted: the purchases and the banked amount.
 * Banking happens on uprooting, because that removes the history and the earned
 * total would otherwise shrink.
 *
 * Free of UI and database ties.
 */

import { COINS_PER_WATERING, REPEATING_BONUS, STREAK_BONUSES } from '../config/economy'
import type { GardenSettings, Plant } from '../types'
import { missedIntervalsFor, safeIntervalDays } from './growth'
import { dayNumber } from './time'

/**
 * Lengths of every run in the history, in chronological order.
 *
 * A run breaks exactly when the gap would also have cost health — judged by the
 * same `missedIntervalsFor()` as wilting and the streak. That way coins and
 * plant state cannot drift apart.
 */
const runLengths = (waterings: readonly number[], intervalDays: number): number[] => {
  if (waterings.length === 0) return []

  const lengths: number[] = []
  let current = 1

  for (let index = 1; index < waterings.length; index += 1) {
    const previous = waterings[index - 1]
    const watering = waterings[index]
    if (previous === undefined || watering === undefined) break

    const gapDays = dayNumber(watering) - dayNumber(previous)
    if (missedIntervalsFor(gapDays - intervalDays, intervalDays) === 0) {
      current += 1
    } else {
      lengths.push(current)
      current = 1
    }
  }

  lengths.push(current)
  return lengths
}

/** Sum of every milestone a run of this length has reached. */
export const bonusForStreak = (length: number): number => {
  const fromTable = STREAK_BONUSES.reduce(
    (total, bonus) => (length >= bonus.at ? total + bonus.coins : total),
    0,
  )

  const last = STREAK_BONUSES.at(-1)
  if (!last || length <= last.at) return fromTable

  const repeats = Math.floor((length - last.at) / REPEATING_BONUS.every)
  return fromTable + repeats * REPEATING_BONUS.coins
}

/** What a single plant has earned over its lifetime. */
export const coinsEarnedFor = (plant: Plant): number => {
  const intervalDays = safeIntervalDays(plant.intervalDays)

  const fromWaterings = plant.waterings.length * COINS_PER_WATERING
  const fromStreaks = runLengths(plant.waterings, intervalDays).reduce(
    (total, length) => total + bonusForStreak(length),
    0,
  )

  return fromWaterings + fromStreaks
}

export const coinsEarned = (plants: readonly Plant[]): number =>
  plants.reduce((total, plant) => total + coinsEarnedFor(plant), 0)

export const coinsSpent = (settings: GardenSettings): number =>
  settings.purchases.reduce((total, purchase) => total + purchase.price, 0)

/** Cannot go negative as long as uprooting banks the coins. */
export const coinBalance = (plants: readonly Plant[], settings: GardenSettings): number =>
  coinsEarned(plants) + settings.bankedCoins - coinsSpent(settings)

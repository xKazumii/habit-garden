/**
 * The coin economy.
 *
 * Calibration: a garden of four daily habits, watered consistently, holds about
 * 48 coins after a week, 280 after a month and 1160 after a hundred days. The 24
 * purchasable species cost 2455 in total — so a complete collection takes about
 * half a year, or roughly a year with irregular watering.
 *
 * Changing these numbers changes the pace of the whole app. The prices live with
 * the species in src/config/species.ts.
 */

/** The unit is a watering, not a calendar day: equal work, equal pay. */
export const COINS_PER_WATERING = 1

export interface StreakBonus {
  /** Run length at which the bonus is paid. */
  at: number
  coins: number
}

/**
 * Bonuses apply **per run**, not once per plant: rebuilding after a break earns
 * them again. Sorted ascending.
 */
export const STREAK_BONUSES: readonly StreakBonus[] = [
  { at: 7, coins: 5 },
  { at: 14, coins: 10 },
  { at: 30, coins: 25 },
  { at: 60, coins: 50 },
  { at: 100, coins: 100 },
]

/**
 * So that very long runs do not run dry: beyond the last milestone the same
 * bonus is paid every `every` further times.
 */
export const REPEATING_BONUS = { every: 100, coins: 100 } as const

/**
 * Calendar-day arithmetic.
 *
 * All due-date logic in this app counts *local calendar days*, not 24-hour
 * steps. "Daily" means once per calendar day: water at 23:50 and you may water
 * again the next morning. With 24-hour arithmetic the due time would drift
 * later with every late watering.
 *
 * Timestamps are still stored as epoch milliseconds. Comparisons go exclusively
 * through `dayNumber()`.
 */

const MS_PER_DAY = 86_400_000

/**
 * Running number of the local calendar day.
 *
 * Deliberately built from the local calendar fields and `Date.UTC` rather than
 * `timestamp / MS_PER_DAY`. That makes it DST-safe: a day with 23 or 25 hours
 * still counts as exactly one day.
 */
export const dayNumber = (timestamp: number): number => {
  const date = new Date(timestamp)
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY)
}

/** Local midnight of the day that `timestamp` falls in. */
export const startOfLocalDay = (timestamp: number): number => {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/**
 * Local midnight `days` calendar days after the day of `timestamp`.
 * Computed via `setDate`, i.e. through calendar fields rather than milliseconds.
 */
export const startOfLocalDayPlus = (timestamp: number, days: number): number => {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date.getTime()
}

/** Whole calendar days from `from` to `to`. Negative if `to` is earlier. */
export const daysBetween = (from: number, to: number): number => dayNumber(to) - dayNumber(from)

export const isSameLocalDay = (a: number, b: number): boolean => dayNumber(a) === dayNumber(b)

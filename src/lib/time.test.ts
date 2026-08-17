import { describe, expect, it } from 'vitest'

import { dayNumber, daysBetween, isSameLocalDay, startOfLocalDay, startOfLocalDayPlus } from './time'

const HOUR_MS = 3_600_000

/** Timestamp from local calendar fields. Month is 1-based to keep tests readable. */
const local = (year: number, month: number, day: number, hour = 12, minute = 0): number =>
  new Date(year, month - 1, day, hour, minute, 0, 0).getTime()

/**
 * Runs `run` in a different time zone. Node re-reads process.env.TZ on every
 * assignment, so this affects all subsequent Date operations.
 */
const withTimeZone = <T>(timeZone: string, run: () => T): T => {
  const previous = process.env.TZ
  process.env.TZ = timeZone
  try {
    return run()
  } finally {
    if (previous === undefined) delete process.env.TZ
    else process.env.TZ = previous
  }
}

describe('dayNumber', () => {
  it('stays constant across the whole calendar day', () => {
    expect(dayNumber(local(2026, 6, 1, 0, 0))).toBe(dayNumber(local(2026, 6, 1, 23, 59)))
  })

  it('increases by exactly 1 per calendar day', () => {
    expect(dayNumber(local(2026, 6, 2)) - dayNumber(local(2026, 6, 1))).toBe(1)
  })

  it('follows local midnight rather than UTC', () => {
    // 2026-06-14T13:00Z is already 15 June, 01:00 in Auckland (UTC+12).
    // An implementation that bluntly computes timestamp / 86400000 would see two
    // different days here.
    withTimeZone('Pacific/Auckland', () => {
      const earlyMorning = Date.UTC(2026, 5, 14, 13, 0)
      const sameDayNoon = Date.UTC(2026, 5, 15, 0, 0)
      expect(dayNumber(earlyMorning)).toBe(dayNumber(sameDayNoon))
    })
  })

  it('works in zones with a half-hour offset', () => {
    withTimeZone('Asia/Kolkata', () => {
      // 18:45Z is already 00:15 the next day in Kolkata (UTC+5:30).
      expect(dayNumber(Date.UTC(2026, 5, 14, 18, 45))).toBe(dayNumber(Date.UTC(2026, 5, 15, 6, 0)))
      expect(dayNumber(Date.UTC(2026, 5, 14, 18, 15))).toBe(dayNumber(Date.UTC(2026, 5, 14, 12, 0)))
    })
  })
})

describe('daysBetween', () => {
  it('counts across month and year boundaries', () => {
    expect(daysBetween(local(2026, 6, 30), local(2026, 7, 1))).toBe(1)
    expect(daysBetween(local(2026, 12, 31), local(2027, 1, 1))).toBe(1)
    expect(daysBetween(local(2026, 2, 28), local(2026, 3, 1))).toBe(1)
  })

  it('is negative when the target is earlier', () => {
    expect(daysBetween(local(2026, 6, 10), local(2026, 6, 7))).toBe(-3)
  })

  it('counts the 23-hour day at the DST start as exactly one day', () => {
    withTimeZone('Europe/Berlin', () => {
      const before = local(2026, 3, 28, 12)
      const after = local(2026, 3, 29, 12)
      // The day really is shorter — otherwise the test proves nothing.
      expect((after - before) / HOUR_MS).toBe(23)
      expect(daysBetween(before, after)).toBe(1)
    })
  })

  it('counts the 25-hour day at the DST end as exactly one day', () => {
    withTimeZone('Europe/Berlin', () => {
      const before = local(2026, 10, 24, 12)
      const after = local(2026, 10, 25, 12)
      expect((after - before) / HOUR_MS).toBe(25)
      expect(daysBetween(before, after)).toBe(1)
    })
  })
})

describe('startOfLocalDay', () => {
  it('returns local midnight of the same day', () => {
    const start = new Date(startOfLocalDay(local(2026, 6, 1, 17, 42)))
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(start.getDate()).toBe(1)
  })
})

describe('startOfLocalDayPlus', () => {
  it('stays local midnight even across the DST switch', () => {
    withTimeZone('Europe/Berlin', () => {
      const watered = local(2026, 3, 27, 21, 0)
      const due = new Date(startOfLocalDayPlus(watered, 3))

      expect(due.getDate()).toBe(30)
      expect(due.getHours()).toBe(0)

      // Millisecond arithmetic would yield 01:00 here, because 29 March only
      // has 23 hours.
      const naive = new Date(startOfLocalDay(watered) + 3 * 24 * HOUR_MS)
      expect(naive.getHours()).toBe(1)
    })
  })

  it('computes across month boundaries', () => {
    const result = new Date(startOfLocalDayPlus(local(2026, 1, 30), 3))
    expect(result.getMonth()).toBe(1)
    expect(result.getDate()).toBe(2)
  })

  it('accepts 0 and then returns the start of the day', () => {
    expect(startOfLocalDayPlus(local(2026, 6, 1, 15), 0)).toBe(startOfLocalDay(local(2026, 6, 1, 15)))
  })
})

describe('isSameLocalDay', () => {
  it('distinguishes calendar days, not 24-hour windows', () => {
    expect(isSameLocalDay(local(2026, 6, 1, 0, 1), local(2026, 6, 1, 23, 59))).toBe(true)
    expect(isSameLocalDay(local(2026, 6, 1, 23, 59), local(2026, 6, 2, 0, 1))).toBe(false)
  })
})

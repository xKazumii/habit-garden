import { describe, expect, it } from 'vitest'

import { dayNumber, daysBetween, isSameLocalDay, startOfLocalDay, startOfLocalDayPlus } from './time'

const HOUR_MS = 3_600_000

/** Zeitstempel aus lokalen Kalenderfeldern. Monat 1-basiert, damit Tests lesbar bleiben. */
const local = (year: number, month: number, day: number, hour = 12, minute = 0): number =>
  new Date(year, month - 1, day, hour, minute, 0, 0).getTime()

/**
 * Führt `run` in einer anderen Zeitzone aus. Node liest process.env.TZ bei
 * jeder Zuweisung neu ein, deshalb wirkt das auf alle folgenden Date-Operationen.
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
  it('ist über den ganzen Kalendertag hinweg konstant', () => {
    expect(dayNumber(local(2026, 6, 1, 0, 0))).toBe(dayNumber(local(2026, 6, 1, 23, 59)))
  })

  it('erhöht sich um genau 1 pro Kalendertag', () => {
    expect(dayNumber(local(2026, 6, 2)) - dayNumber(local(2026, 6, 1))).toBe(1)
  })

  it('richtet sich nach der lokalen Mitternacht, nicht nach UTC', () => {
    // 2026-06-14T13:00Z ist in Auckland (UTC+12) schon der 15. Juni, 01:00.
    // Eine Implementierung, die stumpf timestamp / 86400000 rechnet, würde hier
    // zwei verschiedene Tage sehen.
    withTimeZone('Pacific/Auckland', () => {
      const earlyMorning = Date.UTC(2026, 5, 14, 13, 0)
      const sameDayNoon = Date.UTC(2026, 5, 15, 0, 0)
      expect(dayNumber(earlyMorning)).toBe(dayNumber(sameDayNoon))
    })
  })

  it('funktioniert in Zonen mit halbstündigem Offset', () => {
    withTimeZone('Asia/Kolkata', () => {
      // 18:45Z ist in Kolkata (UTC+5:30) bereits 00:15 des Folgetags.
      expect(dayNumber(Date.UTC(2026, 5, 14, 18, 45))).toBe(dayNumber(Date.UTC(2026, 5, 15, 6, 0)))
      expect(dayNumber(Date.UTC(2026, 5, 14, 18, 15))).toBe(dayNumber(Date.UTC(2026, 5, 14, 12, 0)))
    })
  })
})

describe('daysBetween', () => {
  it('zählt über Monats- und Jahresgrenzen', () => {
    expect(daysBetween(local(2026, 6, 30), local(2026, 7, 1))).toBe(1)
    expect(daysBetween(local(2026, 12, 31), local(2027, 1, 1))).toBe(1)
    expect(daysBetween(local(2026, 2, 28), local(2026, 3, 1))).toBe(1)
  })

  it('ist negativ, wenn das Ziel früher liegt', () => {
    expect(daysBetween(local(2026, 6, 10), local(2026, 6, 7))).toBe(-3)
  })

  it('zählt den 23-Stunden-Tag zum Sommerzeitbeginn als genau einen Tag', () => {
    withTimeZone('Europe/Berlin', () => {
      const before = local(2026, 3, 28, 12)
      const after = local(2026, 3, 29, 12)
      // Der Tag ist wirklich kürzer — sonst prüft der Test nichts.
      expect((after - before) / HOUR_MS).toBe(23)
      expect(daysBetween(before, after)).toBe(1)
    })
  })

  it('zählt den 25-Stunden-Tag zum Sommerzeitende als genau einen Tag', () => {
    withTimeZone('Europe/Berlin', () => {
      const before = local(2026, 10, 24, 12)
      const after = local(2026, 10, 25, 12)
      expect((after - before) / HOUR_MS).toBe(25)
      expect(daysBetween(before, after)).toBe(1)
    })
  })
})

describe('startOfLocalDay', () => {
  it('liefert lokale Mitternacht desselben Tages', () => {
    const start = new Date(startOfLocalDay(local(2026, 6, 1, 17, 42)))
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(start.getDate()).toBe(1)
  })
})

describe('startOfLocalDayPlus', () => {
  it('bleibt auch über die Sommerzeitumstellung hinweg lokale Mitternacht', () => {
    withTimeZone('Europe/Berlin', () => {
      const watered = local(2026, 3, 27, 21, 0)
      const due = new Date(startOfLocalDayPlus(watered, 3))

      expect(due.getDate()).toBe(30)
      expect(due.getHours()).toBe(0)

      // Millisekunden-Arithmetik würde hier 01:00 ergeben, weil der 29. März
      // nur 23 Stunden hat.
      const naive = new Date(startOfLocalDay(watered) + 3 * 24 * HOUR_MS)
      expect(naive.getHours()).toBe(1)
    })
  })

  it('rechnet über Monatsgrenzen', () => {
    const result = new Date(startOfLocalDayPlus(local(2026, 1, 30), 3))
    expect(result.getMonth()).toBe(1)
    expect(result.getDate()).toBe(2)
  })

  it('akzeptiert 0 und liefert dann den Tagesbeginn', () => {
    expect(startOfLocalDayPlus(local(2026, 6, 1, 15), 0)).toBe(startOfLocalDay(local(2026, 6, 1, 15)))
  })
})

describe('isSameLocalDay', () => {
  it('unterscheidet Kalendertage, nicht 24-Stunden-Fenster', () => {
    expect(isSameLocalDay(local(2026, 6, 1, 0, 1), local(2026, 6, 1, 23, 59))).toBe(true)
    expect(isSameLocalDay(local(2026, 6, 1, 23, 59), local(2026, 6, 2, 0, 1))).toBe(false)
  })
})

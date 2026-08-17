import { describe, expect, it } from 'vitest'

import type { Plant } from '../types'
import {
  canWater,
  countDue,
  derivePlantState,
  growthStageFor,
  missedIntervalsFor,
  reconcileStatus,
  water,
} from './growth'

const HOUR_MS = 3_600_000

/** Zeitstempel aus lokalen Kalenderfeldern. Monat 1-basiert, damit Tests lesbar bleiben. */
const local = (year: number, month: number, day: number, hour = 12, minute = 0): number =>
  new Date(year, month - 1, day, hour, minute, 0, 0).getTime()

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

const JUNE_1 = local(2026, 6, 1, 9)

const makePlant = (overrides: Partial<Plant> = {}): Plant => ({
  id: 'p1',
  category: 'herb',
  species: 'basil',
  habitName: 'Morgens zwei Gläser Wasser',
  intervalDays: 1,
  createdAt: JUNE_1,
  lastWateredAt: JUNE_1,
  waterings: [JUNE_1],
  growthPoints: 1,
  status: 'alive',
  ...overrides,
})

/** Pflanze, die an aufeinanderfolgenden Tagen ab dem 1. Juni gegossen wurde. */
const wateredOnDays = (days: readonly number[], overrides: Partial<Plant> = {}): Plant => {
  const waterings = days.map((day) => local(2026, 6, day, 9))
  const last = waterings.at(-1)
  return makePlant({
    createdAt: waterings[0] ?? JUNE_1,
    lastWateredAt: last ?? null,
    waterings,
    growthPoints: waterings.length,
    ...overrides,
  })
}

describe('growthStageFor', () => {
  it('braucht bei Kräutern 3 Punkte pro Stufe', () => {
    expect(growthStageFor('herb', 0)).toBe(0)
    expect(growthStageFor('herb', 2)).toBe(0)
    expect(growthStageFor('herb', 3)).toBe(1)
    expect(growthStageFor('herb', 11)).toBe(3)
    expect(growthStageFor('herb', 12)).toBe(4)
  })

  it('braucht bei Blumen 5 und bei Bäumen 8 Punkte pro Stufe', () => {
    expect(growthStageFor('flower', 4)).toBe(0)
    expect(growthStageFor('flower', 5)).toBe(1)
    expect(growthStageFor('flower', 19)).toBe(3)
    expect(growthStageFor('flower', 20)).toBe(4)

    expect(growthStageFor('tree', 7)).toBe(0)
    expect(growthStageFor('tree', 8)).toBe(1)
    expect(growthStageFor('tree', 31)).toBe(3)
    expect(growthStageFor('tree', 32)).toBe(4)
  })

  it('deckelt bei der höchsten Stufe und verträgt Unsinn', () => {
    expect(growthStageFor('herb', 999)).toBe(4)
    expect(growthStageFor('tree', -5)).toBe(0)
  })
})

describe('missedIntervalsFor', () => {
  it('zählt vor der Fälligkeit und während der Karenz nichts', () => {
    expect(missedIntervalsFor(-3, 1)).toBe(0)
    expect(missedIntervalsFor(0, 1)).toBe(0)
    expect(missedIntervalsFor(6, 7)).toBe(0)
    expect(missedIntervalsFor(2, 3)).toBe(0)
  })

  it('zählt danach ein Intervall pro versäumtem Block', () => {
    expect(missedIntervalsFor(1, 1)).toBe(1)
    expect(missedIntervalsFor(4, 1)).toBe(4)

    expect(missedIntervalsFor(3, 3)).toBe(1)
    expect(missedIntervalsFor(5, 3)).toBe(1)
    expect(missedIntervalsFor(6, 3)).toBe(2)

    expect(missedIntervalsFor(7, 7)).toBe(1)
    expect(missedIntervalsFor(13, 7)).toBe(1)
    expect(missedIntervalsFor(14, 7)).toBe(2)
  })

  it('fällt bei kaputtem Intervall auf einen Tag zurück statt durch 0 zu teilen', () => {
    expect(missedIntervalsFor(3, 0)).toBe(3)
    expect(missedIntervalsFor(3, Number.NaN)).toBe(3)
  })
})

describe('Fälligkeit', () => {
  it('macht eine frisch gepflanzte Pflanze sofort fällig', () => {
    const plant = makePlant({ lastWateredAt: null, waterings: [], growthPoints: 0 })
    const state = derivePlantState(plant, local(2026, 6, 1, 10))

    expect(state.isDue).toBe(true)
    expect(state.daysUntilDue).toBe(0)
    expect(state.health).toBe(100)
    expect(state.healthState).toBe('thirsty')
    expect(state.growthStage).toBe(0)
    expect(state.streak).toBe(0)
  })

  it('ist direkt nach dem Gießen nicht mehr fällig', () => {
    const state = derivePlantState(makePlant(), local(2026, 6, 1, 20))

    expect(state.isDue).toBe(false)
    expect(state.daysUntilDue).toBe(1)
    expect(state.healthState).toBe('healthy')
  })

  it('ist bei Intervall 1 am nächsten Kalendertag fällig', () => {
    expect(derivePlantState(makePlant(), local(2026, 6, 2, 0, 5)).isDue).toBe(true)
  })

  it('wartet bei Intervall 3 bis zum dritten Tag', () => {
    const plant = makePlant({ intervalDays: 3 })

    expect(derivePlantState(plant, local(2026, 6, 2)).isDue).toBe(false)
    expect(derivePlantState(plant, local(2026, 6, 3)).isDue).toBe(false)
    expect(derivePlantState(plant, local(2026, 6, 4, 0, 1)).isDue).toBe(true)
  })

  it('nennt den Fälligkeitstag als lokale Mitternacht', () => {
    const dueAt = new Date(derivePlantState(makePlant({ intervalDays: 7 }), JUNE_1).dueAt)

    expect(dueAt.getDate()).toBe(8)
    expect(dueAt.getHours()).toBe(0)
  })

  it('macht eine eingegangene Pflanze nie fällig', () => {
    const plant = makePlant({ status: 'dead' })

    expect(derivePlantState(plant, local(2026, 6, 20)).isDue).toBe(false)
    expect(canWater(plant, local(2026, 6, 20))).toBe(false)
  })
})

describe('Gießen kurz vor Mitternacht', () => {
  const wateredAt = local(2026, 6, 1, 23, 50)
  const lateNightPlant = (intervalDays = 1): Plant =>
    makePlant({ intervalDays, createdAt: wateredAt, lastWateredAt: wateredAt, waterings: [wateredAt] })

  it('ist am nächsten Morgen fällig, obwohl keine 24 Stunden vergangen sind', () => {
    const nextMorning = local(2026, 6, 2, 7, 0)

    expect(nextMorning - wateredAt).toBeLessThan(24 * HOUR_MS)
    expect(derivePlantState(lateNightPlant(), nextMorning).isDue).toBe(true)
  })

  it('ist neun Minuten später am selben Tag noch nicht fällig', () => {
    expect(derivePlantState(lateNightPlant(), local(2026, 6, 1, 23, 59)).isDue).toBe(false)
  })

  it('überspringt bei Intervall 2 trotzdem den ganzen Folgetag', () => {
    const plant = lateNightPlant(2)

    expect(derivePlantState(plant, local(2026, 6, 2, 7, 0)).isDue).toBe(false)
    expect(derivePlantState(plant, local(2026, 6, 3, 0, 5)).isDue).toBe(true)
  })

  it('driftet nicht: immer früher am Abend gießen bleibt im Tagesrhythmus', () => {
    // Mit 24-Stunden-Arithmetik würde das zweite Gießen scheitern, weil es
    // zehn Minuten "zu früh" käme. Kalendarisch ist es ein neuer Tag.
    const nights = [local(2026, 6, 1, 23, 50), local(2026, 6, 2, 23, 40), local(2026, 6, 3, 23, 30)]
    let current = makePlant({
      createdAt: local(2026, 6, 1, 20),
      lastWateredAt: null,
      waterings: [],
      growthPoints: 0,
    })

    nights.forEach((night) => {
      const outcome = water(current, night)
      expect(outcome.ok).toBe(true)
      if (outcome.ok) current = outcome.plant
    })

    expect(current.growthPoints).toBe(3)
    expect(derivePlantState(current, local(2026, 6, 3, 23, 55)).streak).toBe(3)
  })
})

describe('Gesundheit', () => {
  it('ist voll und gesund, solange nichts fällig ist', () => {
    const state = derivePlantState(makePlant(), local(2026, 6, 1, 18))

    expect(state.health).toBe(100)
    expect(state.healthState).toBe('healthy')
    expect(state.isOverdue).toBe(false)
  })

  it('bleibt am Fälligkeitstag voll, ist aber durstig — ein Intervall Karenz', () => {
    const state = derivePlantState(makePlant(), local(2026, 6, 2, 8))

    expect(state.isDue).toBe(true)
    expect(state.health).toBe(100)
    expect(state.healthState).toBe('thirsty')
    expect(state.isOverdue).toBe(false)
    expect(state.missedIntervals).toBe(0)
  })

  it('sinkt danach um 25 Punkte pro verpasstem Intervall bis zum Eingehen', () => {
    const plant = makePlant()
    const healthOn = (day: number): number => derivePlantState(plant, local(2026, 6, day, 8)).health

    expect(healthOn(3)).toBe(75)
    expect(healthOn(4)).toBe(50)
    expect(healthOn(5)).toBe(25)
    expect(healthOn(6)).toBe(0)
  })

  it('meldet welk statt gesund, sobald überhaupt Gesundheit fehlt', () => {
    // Die Spec nennt "gesund (>66)", was mit den 25er-Schritten kollidiert:
    // 75 Punkte bedeuten bereits ein verpasstes Intervall. Präzedenz gewinnt.
    const state = derivePlantState(makePlant(), local(2026, 6, 3, 8))

    expect(state.health).toBe(75)
    expect(state.healthState).toBe('wilting')
    expect(state.isOverdue).toBe(true)
  })

  it('geht bei 0 ein und bleibt dann bei 0', () => {
    const state = derivePlantState(makePlant(), local(2026, 6, 6, 8))

    expect(state.status).toBe('dead')
    expect(state.health).toBe(0)
    expect(state.healthState).toBe('dead')
    expect(state.streak).toBe(0)
  })

  it('baut bei Intervall 7 in Wochenschritten ab', () => {
    const plant = makePlant({ intervalDays: 7 })
    const stateOn = (month: number, day: number) => derivePlantState(plant, local(2026, month, day, 8))

    expect(stateOn(6, 8).healthState).toBe('thirsty')
    expect(stateOn(6, 14).health).toBe(100)
    expect(stateOn(6, 15).health).toBe(75)
    expect(stateOn(6, 22).health).toBe(50)
    expect(stateOn(6, 29).health).toBe(25)
    expect(stateOn(7, 6).status).toBe('dead')
  })

  it('erweckt eine eingegangene Pflanze nicht, wenn das Intervall verlängert wird', () => {
    const dead = makePlant({ status: 'dead', intervalDays: 30 })
    const state = derivePlantState(dead, local(2026, 6, 3))

    expect(state.status).toBe('dead')
    expect(state.health).toBe(0)
  })
})

describe('App war lange geschlossen', () => {
  it('ist nach drei Wochen ohne Gießen bei Intervall 1 eingegangen', () => {
    const state = derivePlantState(makePlant(), local(2026, 6, 22, 10))

    expect(state.status).toBe('dead')
    expect(state.health).toBe(0)
    expect(state.streak).toBe(0)
  })

  it('ist nach drei Wochen bei Intervall 7 welk, aber am Leben', () => {
    const state = derivePlantState(makePlant({ intervalDays: 7 }), local(2026, 6, 22, 10))

    expect(state.status).toBe('alive')
    expect(state.health).toBe(50)
    expect(state.healthState).toBe('wilting')
    expect(state.missedIntervals).toBe(2)
  })

  it('ergibt denselben Zustand, egal ob zwischendurch gerendert wurde', () => {
    const plant = Object.freeze(makePlant({ intervalDays: 7, waterings: Object.freeze([JUNE_1]) as number[] }))
    const openedAt = local(2026, 6, 22, 10)

    // Simuliert 21 Tage Renders. Es gibt keine Timer und keinen Zustand
    // zwischen den Aufrufen — das Ergebnis darf davon nicht abhängen.
    for (let day = 1; day <= 21; day += 1) {
      derivePlantState(plant, local(2026, 6, day, 10))
    }

    expect(derivePlantState(plant, openedAt)).toEqual(
      derivePlantState(makePlant({ intervalDays: 7 }), openedAt),
    )
    expect(plant.waterings).toEqual([JUNE_1])
    expect(plant.growthPoints).toBe(1)
  })

  it('baut monoton ab, ohne Sprünge nach oben', () => {
    const plant = makePlant()
    let previous = 100

    for (let day = 1; day <= 30; day += 1) {
      const { health } = derivePlantState(plant, local(2026, 6, day, 10))
      expect(health).toBeLessThanOrEqual(previous)
      previous = health
    }

    expect(previous).toBe(0)
  })

  it('liefert bei mehrfachem Aufruf mit derselben Zeit identische Werte', () => {
    const plant = makePlant()
    const now = local(2026, 6, 4, 15)

    expect(derivePlantState(plant, now)).toEqual(derivePlantState(plant, now))
  })
})

describe('Sommerzeit', () => {
  it('ist am Tag nach dem Gießen fällig, auch wenn dieser nur 23 Stunden hat', () => {
    withTimeZone('Europe/Berlin', () => {
      const wateredAt = local(2026, 3, 28, 12)
      const plant = makePlant({ createdAt: wateredAt, lastWateredAt: wateredAt, waterings: [wateredAt] })
      const nextMorning = local(2026, 3, 29, 11, 30)

      // Physisch nur 22,5 Stunden — kalendarisch ein ganzer Tag.
      expect((nextMorning - wateredAt) / HOUR_MS).toBe(22.5)
      expect(derivePlantState(plant, nextMorning).isDue).toBe(true)
    })
  })

  it('bestraft den 25-Stunden-Tag nicht', () => {
    withTimeZone('Europe/Berlin', () => {
      const wateredAt = local(2026, 10, 24, 12)
      const plant = makePlant({ createdAt: wateredAt, lastWateredAt: wateredAt, waterings: [wateredAt] })
      const dueDayNoon = local(2026, 10, 25, 12)

      expect((dueDayNoon - wateredAt) / HOUR_MS).toBe(25)

      const state = derivePlantState(plant, dueDayNoon)
      expect(state.isDue).toBe(true)
      expect(state.health).toBe(100)
      expect(state.healthState).toBe('thirsty')
    })
  })

  it('zählt Kalendertage über die Umstellung hinweg, nicht 24-Stunden-Blöcke', () => {
    withTimeZone('Europe/Berlin', () => {
      const wateredAt = local(2026, 3, 27, 21)
      const plant = makePlant({ createdAt: wateredAt, lastWateredAt: wateredAt, waterings: [wateredAt] })

      // 28. fällig (Karenz), 29. ein Intervall verpasst, 30. zwei.
      expect(derivePlantState(plant, local(2026, 3, 28, 21)).health).toBe(100)
      expect(derivePlantState(plant, local(2026, 3, 29, 21)).health).toBe(75)
      expect(derivePlantState(plant, local(2026, 3, 30, 21)).health).toBe(50)
    })
  })
})

describe('Zeitzonenwechsel', () => {
  it('folgt der Gerätezeit: dieselben Zeitstempel, andere Zone, andere Fälligkeit', () => {
    const wateredAt = Date.UTC(2026, 2, 10, 0, 0)
    const now = Date.UTC(2026, 2, 10, 6, 0)
    const plant = makePlant({ createdAt: wateredAt, lastWateredAt: wateredAt, waterings: [wateredAt] })

    // Berlin (UTC+1): gegossen am 10.03. um 01:00, jetzt 07:00 am 10.03. —
    // derselbe Kalendertag, also noch nicht fällig.
    const berlin = withTimeZone('Europe/Berlin', () => derivePlantState(plant, now))
    expect(berlin.isDue).toBe(false)
    expect(berlin.daysUntilDue).toBe(1)

    // New York (UTC-4, Sommerzeit seit 08.03.): gegossen am 09.03. um 20:00,
    // jetzt 02:00 am 10.03. — ein Kalendertag später, also fällig.
    const newYork = withTimeZone('America/New_York', () => derivePlantState(plant, now))
    expect(newYork.isDue).toBe(true)
    expect(newYork.daysUntilDue).toBe(0)
  })

  it('ist bei langem Rückstand in jeder Zone eingegangen', () => {
    const wateredAt = Date.UTC(2026, 5, 1, 12, 0)
    const now = Date.UTC(2026, 6, 11, 12, 0)
    const plant = makePlant({ createdAt: wateredAt, lastWateredAt: wateredAt, waterings: [wateredAt] })

    const zones = [
      'UTC',
      'Europe/Berlin',
      'America/New_York',
      'Pacific/Auckland',
      'Asia/Kolkata',
      'Pacific/Kiritimati',
    ]

    zones.forEach((zone) => {
      const state = withTimeZone(zone, () => derivePlantState(plant, now))
      expect(state.status).toBe('dead')
      expect(state.health).toBe(0)
      expect(state.streak).toBe(0)
    })
  })

  it('verschiebt den Streak nicht, solange Gießabstände ganze Kalendertage bleiben', () => {
    const perfect = wateredOnDays([1, 2, 3, 4, 5])

    const berlin = withTimeZone('Europe/Berlin', () => derivePlantState(perfect, local(2026, 6, 5, 20)))
    expect(berlin.streak).toBe(5)
  })
})

describe('Streak', () => {
  it('ist 0 ohne Gießvorgang', () => {
    const plant = makePlant({ lastWateredAt: null, waterings: [], growthPoints: 0 })
    expect(derivePlantState(plant, local(2026, 6, 1, 10)).streak).toBe(0)
  })

  it('zählt aufeinanderfolgende Gießvorgänge', () => {
    const plant = wateredOnDays([1, 2, 3])
    expect(derivePlantState(plant, local(2026, 6, 3, 20)).streak).toBe(3)
  })

  it('bleibt erhalten, solange die Pflanze nur durstig ist', () => {
    const plant = wateredOnDays([1, 2, 3])
    const state = derivePlantState(plant, local(2026, 6, 4, 8))

    expect(state.healthState).toBe('thirsty')
    expect(state.streak).toBe(3)
  })

  it('fällt auf 0, sobald die Karenz überschritten ist', () => {
    const plant = wateredOnDays([1, 2, 3])
    const state = derivePlantState(plant, local(2026, 6, 5, 8))

    expect(state.healthState).toBe('wilting')
    expect(state.streak).toBe(0)
  })

  it('bricht an einer Lücke in der Vergangenheit ab', () => {
    // Am 3. Juni war die Pflanze schon welk — dieses Gießen startet neu.
    const plant = wateredOnDays([1, 4, 5])
    expect(derivePlantState(plant, local(2026, 6, 5, 20)).streak).toBe(2)
  })

  it('verzeiht bei Intervall 3 einen Abstand innerhalb der Karenz', () => {
    const withinGrace = wateredOnDays([1, 6], { intervalDays: 3 })
    expect(derivePlantState(withinGrace, local(2026, 6, 6, 20)).streak).toBe(2)

    const pastGrace = wateredOnDays([1, 7], { intervalDays: 3 })
    expect(derivePlantState(pastGrace, local(2026, 6, 7, 20)).streak).toBe(1)
  })

  it('stellt beim Gießen einer welken Pflanze die Gesundheit her, kostet aber den Streak', () => {
    const plant = wateredOnDays([1, 2, 3, 4, 5])
    expect(derivePlantState(plant, local(2026, 6, 5, 20)).streak).toBe(5)

    const neglected = derivePlantState(plant, local(2026, 6, 8, 9))
    expect(neglected.health).toBe(50)
    expect(neglected.healthState).toBe('wilting')
    expect(neglected.streak).toBe(0)

    const outcome = water(plant, local(2026, 6, 8, 9))
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const revived = derivePlantState(outcome.plant, local(2026, 6, 8, 10))
    expect(revived.health).toBe(100)
    expect(revived.healthState).toBe('healthy')
    expect(revived.streak).toBe(1)
  })
})

describe('water', () => {
  it('verweigert das Gießen, wenn die Pflanze nicht fällig ist', () => {
    expect(water(makePlant(), local(2026, 6, 1, 20))).toEqual({ ok: false, reason: 'not-due' })
  })

  it('verweigert das Gießen einer eingegangenen Pflanze', () => {
    expect(water(makePlant({ status: 'dead' }), local(2026, 6, 2, 8))).toEqual({
      ok: false,
      reason: 'dead',
    })
  })

  it('verweigert das Gießen, wenn die Pflanze gerade eingegangen ist', () => {
    expect(water(makePlant(), local(2026, 6, 10, 8))).toEqual({ ok: false, reason: 'dead' })
  })

  it('vergibt einen Wachstumspunkt und hängt den Zeitstempel an', () => {
    const now = local(2026, 6, 2, 8)
    const outcome = water(makePlant(), now)

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    expect(outcome.plant.growthPoints).toBe(2)
    expect(outcome.plant.lastWateredAt).toBe(now)
    expect(outcome.plant.waterings).toEqual([JUNE_1, now])
  })

  it('mutiert die übergebene Pflanze nicht', () => {
    const waterings = Object.freeze([JUNE_1]) as number[]
    const plant = Object.freeze(makePlant({ waterings })) as Plant

    expect(() => water(plant, local(2026, 6, 2, 8))).not.toThrow()
    expect(plant.waterings).toEqual([JUNE_1])
    expect(plant.growthPoints).toBe(1)
  })

  it('lässt höchstens ein Gießen pro Intervall zu', () => {
    const first = water(makePlant(), local(2026, 6, 2, 8))
    expect(first.ok).toBe(true)
    if (!first.ok) return

    expect(water(first.plant, local(2026, 6, 2, 22))).toEqual({ ok: false, reason: 'not-due' })
    expect(water(first.plant, local(2026, 6, 3, 7)).ok).toBe(true)
  })

  it('führt über genug Gießvorgänge bis zur höchsten Stufe', () => {
    let current = makePlant({ lastWateredAt: null, waterings: [], growthPoints: 0 })

    for (let day = 1; day <= 12; day += 1) {
      const outcome = water(current, local(2026, 6, day, 9))
      expect(outcome.ok).toBe(true)
      if (outcome.ok) current = outcome.plant
    }

    const state = derivePlantState(current, local(2026, 6, 12, 10))
    expect(current.growthPoints).toBe(12)
    expect(state.growthStage).toBe(4)
    expect(state.stageProgress).toBe(1)
    expect(state.streak).toBe(12)
  })
})

describe('stageProgress', () => {
  it('zeigt den Fortschritt innerhalb der Stufe', () => {
    const state = derivePlantState(makePlant({ growthPoints: 4 }), JUNE_1)

    expect(state.growthStage).toBe(1)
    expect(state.pointsPerStage).toBe(3)
    expect(state.pointsIntoStage).toBe(1)
    expect(state.stageProgress).toBeCloseTo(1 / 3)
  })

  it('ist auf der höchsten Stufe voll', () => {
    const state = derivePlantState(makePlant({ growthPoints: 20 }), JUNE_1)

    expect(state.growthStage).toBe(4)
    expect(state.stageProgress).toBe(1)
  })
})

describe('reconcileStatus', () => {
  it('gibt dieselbe Referenz zurück, wenn sich nichts ändert', () => {
    const plant = makePlant()
    expect(reconcileStatus(plant, local(2026, 6, 2, 8))).toBe(plant)
  })

  it('schreibt einen erkannten Tod in den Status', () => {
    const plant = makePlant()
    const reconciled = reconcileStatus(plant, local(2026, 6, 20, 8))

    expect(reconciled.status).toBe('dead')
    expect(plant.status).toBe('alive')
  })

  it('belebt eine eingegangene Pflanze nicht wieder', () => {
    const dead = makePlant({ status: 'dead', intervalDays: 30 })
    expect(reconcileStatus(dead, local(2026, 6, 2, 8)).status).toBe('dead')
  })
})

describe('countDue', () => {
  it('zählt nur lebende, fällige Pflanzen', () => {
    const now = local(2026, 6, 2, 8)
    const plants = [
      makePlant({ id: 'due' }),
      makePlant({ id: 'not-due', intervalDays: 7 }),
      makePlant({ id: 'dead', status: 'dead' }),
      makePlant({ id: 'fresh', lastWateredAt: null, waterings: [], growthPoints: 0 }),
    ]

    expect(countDue(plants, now)).toBe(2)
  })

  it('ist 0 ohne Pflanzen', () => {
    expect(countDue([], local(2026, 6, 2))).toBe(0)
  })
})

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

/** Timestamp from local calendar fields. Month is 1-based to keep tests readable. */
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

/** A plant watered on consecutive days starting 1 June. */
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
  it('needs 3 points per stage for herbs', () => {
    expect(growthStageFor('herb', 0)).toBe(0)
    expect(growthStageFor('herb', 2)).toBe(0)
    expect(growthStageFor('herb', 3)).toBe(1)
    expect(growthStageFor('herb', 11)).toBe(3)
    expect(growthStageFor('herb', 12)).toBe(4)
  })

  it('needs 5 points per stage for flowers and 8 for trees', () => {
    expect(growthStageFor('flower', 4)).toBe(0)
    expect(growthStageFor('flower', 5)).toBe(1)
    expect(growthStageFor('flower', 19)).toBe(3)
    expect(growthStageFor('flower', 20)).toBe(4)

    expect(growthStageFor('tree', 7)).toBe(0)
    expect(growthStageFor('tree', 8)).toBe(1)
    expect(growthStageFor('tree', 31)).toBe(3)
    expect(growthStageFor('tree', 32)).toBe(4)
  })

  it('caps at the highest stage and tolerates nonsense', () => {
    expect(growthStageFor('herb', 999)).toBe(4)
    expect(growthStageFor('tree', -5)).toBe(0)
  })
})

describe('missedIntervalsFor', () => {
  it('counts nothing before the due day and during the grace period', () => {
    expect(missedIntervalsFor(-3, 1)).toBe(0)
    expect(missedIntervalsFor(0, 1)).toBe(0)
    expect(missedIntervalsFor(6, 7)).toBe(0)
    expect(missedIntervalsFor(2, 3)).toBe(0)
  })

  it('counts one interval per missed block afterwards', () => {
    expect(missedIntervalsFor(1, 1)).toBe(1)
    expect(missedIntervalsFor(4, 1)).toBe(4)

    expect(missedIntervalsFor(3, 3)).toBe(1)
    expect(missedIntervalsFor(5, 3)).toBe(1)
    expect(missedIntervalsFor(6, 3)).toBe(2)

    expect(missedIntervalsFor(7, 7)).toBe(1)
    expect(missedIntervalsFor(13, 7)).toBe(1)
    expect(missedIntervalsFor(14, 7)).toBe(2)
  })

  it('falls back to one day for a broken interval instead of dividing by 0', () => {
    expect(missedIntervalsFor(3, 0)).toBe(3)
    expect(missedIntervalsFor(3, Number.NaN)).toBe(3)
  })
})

describe('due dates', () => {
  it('makes a freshly planted plant due immediately', () => {
    const plant = makePlant({ lastWateredAt: null, waterings: [], growthPoints: 0 })
    const state = derivePlantState(plant, local(2026, 6, 1, 10))

    expect(state.isDue).toBe(true)
    expect(state.daysUntilDue).toBe(0)
    expect(state.health).toBe(100)
    expect(state.healthState).toBe('thirsty')
    expect(state.growthStage).toBe(0)
    expect(state.streak).toBe(0)
  })

  it('is no longer due right after watering', () => {
    const state = derivePlantState(makePlant(), local(2026, 6, 1, 20))

    expect(state.isDue).toBe(false)
    expect(state.daysUntilDue).toBe(1)
    expect(state.healthState).toBe('healthy')
  })

  it('is due on the next calendar day at interval 1', () => {
    expect(derivePlantState(makePlant(), local(2026, 6, 2, 0, 5)).isDue).toBe(true)
  })

  it('waits until the third day at interval 3', () => {
    const plant = makePlant({ intervalDays: 3 })

    expect(derivePlantState(plant, local(2026, 6, 2)).isDue).toBe(false)
    expect(derivePlantState(plant, local(2026, 6, 3)).isDue).toBe(false)
    expect(derivePlantState(plant, local(2026, 6, 4, 0, 1)).isDue).toBe(true)
  })

  it('reports the due day as local midnight', () => {
    const dueAt = new Date(derivePlantState(makePlant({ intervalDays: 7 }), JUNE_1).dueAt)

    expect(dueAt.getDate()).toBe(8)
    expect(dueAt.getHours()).toBe(0)
  })

  it('never makes a dead plant due', () => {
    const plant = makePlant({ status: 'dead' })

    expect(derivePlantState(plant, local(2026, 6, 20)).isDue).toBe(false)
    expect(canWater(plant, local(2026, 6, 20))).toBe(false)
  })
})

describe('watering just before midnight', () => {
  const wateredAt = local(2026, 6, 1, 23, 50)
  const lateNightPlant = (intervalDays = 1): Plant =>
    makePlant({ intervalDays, createdAt: wateredAt, lastWateredAt: wateredAt, waterings: [wateredAt] })

  it('is due the next morning even though 24 hours have not passed', () => {
    const nextMorning = local(2026, 6, 2, 7, 0)

    expect(nextMorning - wateredAt).toBeLessThan(24 * HOUR_MS)
    expect(derivePlantState(lateNightPlant(), nextMorning).isDue).toBe(true)
  })

  it('is not yet due nine minutes later on the same day', () => {
    expect(derivePlantState(lateNightPlant(), local(2026, 6, 1, 23, 59)).isDue).toBe(false)
  })

  it('still skips the whole following day at interval 2', () => {
    const plant = lateNightPlant(2)

    expect(derivePlantState(plant, local(2026, 6, 2, 7, 0)).isDue).toBe(false)
    expect(derivePlantState(plant, local(2026, 6, 3, 0, 5)).isDue).toBe(true)
  })

  it('does not drift: watering ever earlier in the evening keeps the daily rhythm', () => {
    // With 24-hour arithmetic the second watering would fail because it comes
    // ten minutes "too early". By the calendar it is a new day.
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

describe('health', () => {
  it('is full and healthy while nothing is due', () => {
    const state = derivePlantState(makePlant(), local(2026, 6, 1, 18))

    expect(state.health).toBe(100)
    expect(state.healthState).toBe('healthy')
    expect(state.isOverdue).toBe(false)
  })

  it('stays full on the due day but turns thirsty — one interval of grace', () => {
    const state = derivePlantState(makePlant(), local(2026, 6, 2, 8))

    expect(state.isDue).toBe(true)
    expect(state.health).toBe(100)
    expect(state.healthState).toBe('thirsty')
    expect(state.isOverdue).toBe(false)
    expect(state.missedIntervals).toBe(0)
  })

  it('then drops 25 points per missed interval until death', () => {
    const plant = makePlant()
    const healthOn = (day: number): number => derivePlantState(plant, local(2026, 6, day, 8)).health

    expect(healthOn(3)).toBe(75)
    expect(healthOn(4)).toBe(50)
    expect(healthOn(5)).toBe(25)
    expect(healthOn(6)).toBe(0)
  })

  it('reports wilting rather than healthy as soon as any health is missing', () => {
    // The spec says "healthy (>66)", which collides with the steps of 25:
    // 75 points already mean one missed interval. Precedence wins.
    const state = derivePlantState(makePlant(), local(2026, 6, 3, 8))

    expect(state.health).toBe(75)
    expect(state.healthState).toBe('wilting')
    expect(state.isOverdue).toBe(true)
  })

  it('dies at 0 and then stays at 0', () => {
    const state = derivePlantState(makePlant(), local(2026, 6, 6, 8))

    expect(state.status).toBe('dead')
    expect(state.health).toBe(0)
    expect(state.healthState).toBe('dead')
    expect(state.streak).toBe(0)
  })

  it('decays in weekly steps at interval 7', () => {
    const plant = makePlant({ intervalDays: 7 })
    const stateOn = (month: number, day: number) => derivePlantState(plant, local(2026, month, day, 8))

    expect(stateOn(6, 8).healthState).toBe('thirsty')
    expect(stateOn(6, 14).health).toBe(100)
    expect(stateOn(6, 15).health).toBe(75)
    expect(stateOn(6, 22).health).toBe(50)
    expect(stateOn(6, 29).health).toBe(25)
    expect(stateOn(7, 6).status).toBe('dead')
  })

  it('does not revive a dead plant when the interval is extended', () => {
    const dead = makePlant({ status: 'dead', intervalDays: 30 })
    const state = derivePlantState(dead, local(2026, 6, 3))

    expect(state.status).toBe('dead')
    expect(state.health).toBe(0)
  })
})

describe('app was closed for a long time', () => {
  it('is dead after three weeks without watering at interval 1', () => {
    const state = derivePlantState(makePlant(), local(2026, 6, 22, 10))

    expect(state.status).toBe('dead')
    expect(state.health).toBe(0)
    expect(state.streak).toBe(0)
  })

  it('is wilting but alive after three weeks at interval 7', () => {
    const state = derivePlantState(makePlant({ intervalDays: 7 }), local(2026, 6, 22, 10))

    expect(state.status).toBe('alive')
    expect(state.health).toBe(50)
    expect(state.healthState).toBe('wilting')
    expect(state.missedIntervals).toBe(2)
  })

  it('yields the same state whether or not it rendered in between', () => {
    const plant = Object.freeze(makePlant({ intervalDays: 7, waterings: Object.freeze([JUNE_1]) as number[] }))
    const openedAt = local(2026, 6, 22, 10)

    // Simulates 21 days of renders. There are no timers and no state between
    // the calls — the result must not depend on them.
    for (let day = 1; day <= 21; day += 1) {
      derivePlantState(plant, local(2026, 6, day, 10))
    }

    expect(derivePlantState(plant, openedAt)).toEqual(
      derivePlantState(makePlant({ intervalDays: 7 }), openedAt),
    )
    expect(plant.waterings).toEqual([JUNE_1])
    expect(plant.growthPoints).toBe(1)
  })

  it('decays monotonically, without jumping back up', () => {
    const plant = makePlant()
    let previous = 100

    for (let day = 1; day <= 30; day += 1) {
      const { health } = derivePlantState(plant, local(2026, 6, day, 10))
      expect(health).toBeLessThanOrEqual(previous)
      previous = health
    }

    expect(previous).toBe(0)
  })

  it('returns identical values when called repeatedly with the same time', () => {
    const plant = makePlant()
    const now = local(2026, 6, 4, 15)

    expect(derivePlantState(plant, now)).toEqual(derivePlantState(plant, now))
  })
})

describe('daylight saving time', () => {
  it('is due the day after watering even when that day has only 23 hours', () => {
    withTimeZone('Europe/Berlin', () => {
      const wateredAt = local(2026, 3, 28, 12)
      const plant = makePlant({ createdAt: wateredAt, lastWateredAt: wateredAt, waterings: [wateredAt] })
      const nextMorning = local(2026, 3, 29, 11, 30)

      // Physically only 22.5 hours — a whole day by the calendar.
      expect((nextMorning - wateredAt) / HOUR_MS).toBe(22.5)
      expect(derivePlantState(plant, nextMorning).isDue).toBe(true)
    })
  })

  it('does not punish the 25-hour day', () => {
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

  it('counts calendar days across the switch, not 24-hour blocks', () => {
    withTimeZone('Europe/Berlin', () => {
      const wateredAt = local(2026, 3, 27, 21)
      const plant = makePlant({ createdAt: wateredAt, lastWateredAt: wateredAt, waterings: [wateredAt] })

      // Due on the 28th (grace), one interval missed on the 29th, two on the 30th.
      expect(derivePlantState(plant, local(2026, 3, 28, 21)).health).toBe(100)
      expect(derivePlantState(plant, local(2026, 3, 29, 21)).health).toBe(75)
      expect(derivePlantState(plant, local(2026, 3, 30, 21)).health).toBe(50)
    })
  })
})

describe('time zone changes', () => {
  it('follows device time: same timestamps, different zone, different due date', () => {
    const wateredAt = Date.UTC(2026, 2, 10, 0, 0)
    const now = Date.UTC(2026, 2, 10, 6, 0)
    const plant = makePlant({ createdAt: wateredAt, lastWateredAt: wateredAt, waterings: [wateredAt] })

    // Berlin (UTC+1): watered on 10 Mar at 01:00, now 07:00 on 10 Mar —
    // the same calendar day, so not due yet.
    const berlin = withTimeZone('Europe/Berlin', () => derivePlantState(plant, now))
    expect(berlin.isDue).toBe(false)
    expect(berlin.daysUntilDue).toBe(1)

    // New York (UTC-4, DST since 8 Mar): watered on 9 Mar at 20:00,
    // now 02:00 on 10 Mar — one calendar day later, so due.
    const newYork = withTimeZone('America/New_York', () => derivePlantState(plant, now))
    expect(newYork.isDue).toBe(true)
    expect(newYork.daysUntilDue).toBe(0)
  })

  it('is dead in every zone once far enough behind', () => {
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

  it('does not shift the streak while watering gaps stay whole calendar days', () => {
    const perfect = wateredOnDays([1, 2, 3, 4, 5])

    const berlin = withTimeZone('Europe/Berlin', () => derivePlantState(perfect, local(2026, 6, 5, 20)))
    expect(berlin.streak).toBe(5)
  })
})

describe('streak', () => {
  it('is 0 without a watering', () => {
    const plant = makePlant({ lastWateredAt: null, waterings: [], growthPoints: 0 })
    expect(derivePlantState(plant, local(2026, 6, 1, 10)).streak).toBe(0)
  })

  it('counts consecutive waterings', () => {
    const plant = wateredOnDays([1, 2, 3])
    expect(derivePlantState(plant, local(2026, 6, 3, 20)).streak).toBe(3)
  })

  it('survives while the plant is merely thirsty', () => {
    const plant = wateredOnDays([1, 2, 3])
    const state = derivePlantState(plant, local(2026, 6, 4, 8))

    expect(state.healthState).toBe('thirsty')
    expect(state.streak).toBe(3)
  })

  it('drops to 0 once the grace period is exceeded', () => {
    const plant = wateredOnDays([1, 2, 3])
    const state = derivePlantState(plant, local(2026, 6, 5, 8))

    expect(state.healthState).toBe('wilting')
    expect(state.streak).toBe(0)
  })

  it('breaks at a gap in the past', () => {
    // On 3 June the plant was already wilting — this watering starts over.
    const plant = wateredOnDays([1, 4, 5])
    expect(derivePlantState(plant, local(2026, 6, 5, 20)).streak).toBe(2)
  })

  it('forgives a gap within the grace period at interval 3', () => {
    const withinGrace = wateredOnDays([1, 6], { intervalDays: 3 })
    expect(derivePlantState(withinGrace, local(2026, 6, 6, 20)).streak).toBe(2)

    const pastGrace = wateredOnDays([1, 7], { intervalDays: 3 })
    expect(derivePlantState(pastGrace, local(2026, 6, 7, 20)).streak).toBe(1)
  })

  it('restores health when watering a wilting plant but costs the streak', () => {
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
  it('refuses to water when the plant is not due', () => {
    expect(water(makePlant(), local(2026, 6, 1, 20))).toEqual({ ok: false, reason: 'not-due' })
  })

  it('refuses to water a dead plant', () => {
    expect(water(makePlant({ status: 'dead' }), local(2026, 6, 2, 8))).toEqual({
      ok: false,
      reason: 'dead',
    })
  })

  it('refuses to water when the plant has just died', () => {
    expect(water(makePlant(), local(2026, 6, 10, 8))).toEqual({ ok: false, reason: 'dead' })
  })

  it('grants one growth point and appends the timestamp', () => {
    const now = local(2026, 6, 2, 8)
    const outcome = water(makePlant(), now)

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    expect(outcome.plant.growthPoints).toBe(2)
    expect(outcome.plant.lastWateredAt).toBe(now)
    expect(outcome.plant.waterings).toEqual([JUNE_1, now])
  })

  it('does not mutate the plant passed in', () => {
    const waterings = Object.freeze([JUNE_1]) as number[]
    const plant = Object.freeze(makePlant({ waterings })) as Plant

    expect(() => water(plant, local(2026, 6, 2, 8))).not.toThrow()
    expect(plant.waterings).toEqual([JUNE_1])
    expect(plant.growthPoints).toBe(1)
  })

  it('allows at most one watering per interval', () => {
    const first = water(makePlant(), local(2026, 6, 2, 8))
    expect(first.ok).toBe(true)
    if (!first.ok) return

    expect(water(first.plant, local(2026, 6, 2, 22))).toEqual({ ok: false, reason: 'not-due' })
    expect(water(first.plant, local(2026, 6, 3, 7)).ok).toBe(true)
  })

  it('reaches the highest stage given enough waterings', () => {
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
  it('shows the progress within the stage', () => {
    const state = derivePlantState(makePlant({ growthPoints: 4 }), JUNE_1)

    expect(state.growthStage).toBe(1)
    expect(state.pointsPerStage).toBe(3)
    expect(state.pointsIntoStage).toBe(1)
    expect(state.stageProgress).toBeCloseTo(1 / 3)
  })

  it('is full at the highest stage', () => {
    const state = derivePlantState(makePlant({ growthPoints: 20 }), JUNE_1)

    expect(state.growthStage).toBe(4)
    expect(state.stageProgress).toBe(1)
  })
})

describe('reconcileStatus', () => {
  it('returns the same reference when nothing changes', () => {
    const plant = makePlant()
    expect(reconcileStatus(plant, local(2026, 6, 2, 8))).toBe(plant)
  })

  it('writes a detected death into the status', () => {
    const plant = makePlant()
    const reconciled = reconcileStatus(plant, local(2026, 6, 20, 8))

    expect(reconciled.status).toBe('dead')
    expect(plant.status).toBe('alive')
  })

  it('does not bring a dead plant back', () => {
    const dead = makePlant({ status: 'dead', intervalDays: 30 })
    expect(reconcileStatus(dead, local(2026, 6, 2, 8)).status).toBe('dead')
  })
})

describe('countDue', () => {
  it('counts only living plants that are due', () => {
    const now = local(2026, 6, 2, 8)
    const plants = [
      makePlant({ id: 'due' }),
      makePlant({ id: 'not-due', intervalDays: 7 }),
      makePlant({ id: 'dead', status: 'dead' }),
      makePlant({ id: 'fresh', lastWateredAt: null, waterings: [], growthPoints: 0 }),
    ]

    expect(countDue(plants, now)).toBe(2)
  })

  it('is 0 without plants', () => {
    expect(countDue([], local(2026, 6, 2))).toBe(0)
  })
})

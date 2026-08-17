/**
 * Growth and wilting logic. The core of the app.
 *
 * Deliberately free of UI, DOM and database dependencies, and fully
 * deterministic: every function receives `now`.
 *
 * The guiding rule: **there are no timers.** Health, stage, streak and status
 * are always derived from the stored timestamps. An app that was closed for
 * three weeks yields exactly the same state on opening as one that stayed open
 * the whole time.
 */

import {
  GRACE_INTERVALS,
  HEALTH_PENALTY_PER_MISSED_INTERVAL,
  MAX_GROWTH_STAGE,
  MAX_HEALTH,
  MIN_HEALTH,
  MIN_INTERVAL_DAYS,
  POINTS_PER_STAGE,
  POINTS_PER_WATERING,
} from '../config/growth'
import type {
  DerivedPlant,
  GrowthStage,
  HealthState,
  Plant,
  PlantCategory,
  PlantStatus,
  PlantState,
  WaterOutcome,
} from '../types'
import { dayNumber, startOfLocalDayPlus } from './time'

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

/** Guards the division in `missedIntervalsFor` against corrupt data. */
export const safeIntervalDays = (intervalDays: number): number =>
  Number.isFinite(intervalDays) ? Math.max(MIN_INTERVAL_DAYS, Math.trunc(intervalDays)) : MIN_INTERVAL_DAYS

/**
 * How many intervals were missed when a plant is `daysOverdue` calendar days
 * past its due day?
 *
 * Zero during the grace period — the plant is "thirsty" then, but at full
 * health. Only afterwards does every further interval count.
 *
 * The same function also judges past watering gaps for the streak. That way
 * health and streak cannot drift apart: exactly the gap that costs health also
 * costs the streak.
 */
export const missedIntervalsFor = (daysOverdue: number, intervalDays: number): number => {
  if (daysOverdue < 0) return 0
  const interval = safeIntervalDays(intervalDays)
  const intervalsOverdue = Math.floor(daysOverdue / interval)
  return Math.max(0, intervalsOverdue - GRACE_INTERVALS + 1)
}

/** Points one stage costs for this category. */
export const pointsPerStageFor = (category: PlantCategory): number => POINTS_PER_STAGE[category]

export const growthStageFor = (category: PlantCategory, growthPoints: number): GrowthStage => {
  const perStage = pointsPerStageFor(category)
  const stage = Math.floor(Math.max(0, growthPoints) / perStage)
  return clamp(stage, 0, MAX_GROWTH_STAGE) as GrowthStage
}

/**
 * The calendar day from which watering is allowed.
 * A freshly planted plant (`lastWateredAt === null`) is due immediately.
 */
const dueDayNumber = (plant: Plant, intervalDays: number): number =>
  plant.lastWateredAt === null
    ? dayNumber(plant.createdAt)
    : dayNumber(plant.lastWateredAt) + intervalDays

/** Timestamp of local midnight on the due day — for display only. */
const dueAtFor = (plant: Plant, intervalDays: number): number =>
  plant.lastWateredAt === null
    ? startOfLocalDayPlus(plant.createdAt, 0)
    : startOfLocalDayPlus(plant.lastWateredAt, intervalDays)

/**
 * Consecutive intervals without a miss.
 *
 * Two ways it ends:
 *  - the plant is *currently* past the grace period (or dead) → 0
 *  - somewhere in the history a gap exceeded the grace period
 *
 * This gives exactly what the spec asks for: watering a wilting plant restores
 * its health but costs the streak.
 */
const streakFrom = (
  waterings: readonly number[],
  intervalDays: number,
  currentMissedIntervals: number,
  status: PlantStatus,
): number => {
  if (status === 'dead') return 0
  if (currentMissedIntervals > 0) return 0
  if (waterings.length === 0) return 0

  let streak = 1
  for (let index = waterings.length - 1; index > 0; index -= 1) {
    const current = waterings[index]
    const previous = waterings[index - 1]
    if (current === undefined || previous === undefined) break

    const gapDays = dayNumber(current) - dayNumber(previous)
    if (missedIntervalsFor(gapDays - intervalDays, intervalDays) > 0) break

    streak += 1
  }
  return streak
}

/**
 * Precedence instead of a threshold.
 *
 * The spec says "healthy (>66)", which collides with the steps of 25: a plant
 * at 75 would be healthy and one interval overdue at the same time. The state is
 * therefore decided by a clear order that leaves no gap:
 * dead → wilting → thirsty → healthy.
 */
const healthStateFor = (status: PlantStatus, health: number, isDue: boolean): HealthState => {
  if (status === 'dead') return 'dead'
  if (health < MAX_HEALTH) return 'wilting'
  if (isDue) return 'thirsty'
  return 'healthy'
}

/**
 * The complete derived state of a plant. None of it is persisted.
 */
export const derivePlantState = (plant: Plant, now: number = Date.now()): PlantState => {
  const intervalDays = safeIntervalDays(plant.intervalDays)

  const dueDay = dueDayNumber(plant, intervalDays)
  const today = dayNumber(now)
  const daysOverdue = today - dueDay

  const missedIntervals = missedIntervalsFor(daysOverdue, intervalDays)
  const decayedHealth = clamp(
    MAX_HEALTH - HEALTH_PENALTY_PER_MISSED_INTERVAL * missedIntervals,
    MIN_HEALTH,
    MAX_HEALTH,
  )

  /*
   * `status` is deliberately sticky in the database: once dead, always dead.
   * Otherwise extending the interval later in the edit flow could revive a dead
   * plant.
   */
  const isDead = plant.status === 'dead' || decayedHealth <= MIN_HEALTH
  const status: PlantStatus = isDead ? 'dead' : 'alive'
  const health = isDead ? MIN_HEALTH : decayedHealth

  const isDue = !isDead && daysOverdue >= 0
  const isOverdue = missedIntervals > 0

  const growthStage = growthStageFor(plant.category, plant.growthPoints)
  const pointsPerStage = pointsPerStageFor(plant.category)
  const points = Math.max(0, plant.growthPoints)
  const isFullyGrown = growthStage >= MAX_GROWTH_STAGE
  const pointsIntoStage = isFullyGrown ? pointsPerStage : points % pointsPerStage

  return {
    status,
    growthStage,
    health,
    healthState: healthStateFor(status, health, isDue),
    isDue,
    isOverdue,
    missedIntervals,
    streak: streakFrom(plant.waterings, intervalDays, missedIntervals, status),
    dueAt: dueAtFor(plant, intervalDays),
    // Deliberately a difference rather than `-daysOverdue`: the latter would
    // yield -0 for plants that are due exactly today.
    daysUntilDue: dueDay - today,
    pointsIntoStage,
    pointsPerStage,
    stageProgress: isFullyGrown ? 1 : pointsIntoStage / pointsPerStage,
  }
}

export const derivePlant = (plant: Plant, now: number = Date.now()): DerivedPlant => ({
  ...plant,
  state: derivePlantState(plant, now),
})

export const derivePlants = (
  plants: readonly Plant[],
  now: number = Date.now(),
): DerivedPlant[] => plants.map((plant) => derivePlant(plant, now))

/** Watering allowed: the plant is alive and due. */
export const canWater = (plant: Plant, now: number = Date.now()): boolean =>
  derivePlantState(plant, now).isDue

/**
 * Waters the plant and returns a *new* plant — no mutation.
 *
 * "At most once per interval" falls out on its own: the next due day follows
 * from `lastWateredAt`, which is set here.
 */
export const water = (plant: Plant, now: number = Date.now()): WaterOutcome => {
  const state = derivePlantState(plant, now)
  if (state.status === 'dead') return { ok: false, reason: 'dead' }
  if (!state.isDue) return { ok: false, reason: 'not-due' }

  return {
    ok: true,
    plant: {
      ...plant,
      lastWateredAt: now,
      waterings: [...plant.waterings, now],
      growthPoints: plant.growthPoints + POINTS_PER_WATERING,
      status: 'alive',
    },
  }
}

/**
 * Writes a detected death back into the persisted field.
 * Returns the same reference when nothing changes — the data layer can check
 * for that and skip the write.
 */
export const reconcileStatus = (plant: Plant, now: number = Date.now()): Plant => {
  const { status } = derivePlantState(plant, now)
  return status === plant.status ? plant : { ...plant, status }
}

export const countDue = (plants: readonly Plant[], now: number = Date.now()): number =>
  plants.reduce((total, plant) => (canWater(plant, now) ? total + 1 : total), 0)

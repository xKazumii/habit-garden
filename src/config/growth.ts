import type { PlantCategory } from '../types'

/** Growth points one stage costs — per category. */
export const POINTS_PER_STAGE: Record<PlantCategory, number> = {
  herb: 3,
  flower: 5,
  tree: 8,
}

/** Points per watering. */
export const POINTS_PER_WATERING = 1

/** Highest stage: 0 seed … 4 blooming. */
export const MAX_GROWTH_STAGE = 4

export const MAX_HEALTH = 100
export const MIN_HEALTH = 0

/** Penalty per missed interval once the grace period has passed. */
export const HEALTH_PENALTY_PER_MISSED_INTERVAL = 25

/**
 * Grace period in intervals: how long a due plant stays at full health
 * ("thirsty") before decay sets in.
 */
export const GRACE_INTERVALS = 1

/** Bounds for a custom rhythm. */
export const MIN_INTERVAL_DAYS = 1
export const MAX_INTERVAL_DAYS = 30

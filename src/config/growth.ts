import type { PlantCategory } from '../types'

/** Wachstumspunkte, die eine Stufe kostet — je Kategorie. */
export const POINTS_PER_STAGE: Record<PlantCategory, number> = {
  herb: 3,
  flower: 5,
  tree: 8,
}

/** Punkte pro Gießvorgang. */
export const POINTS_PER_WATERING = 1

/** Höchste Stufe: 0 Samen … 4 blühend. */
export const MAX_GROWTH_STAGE = 4

export const MAX_HEALTH = 100
export const MIN_HEALTH = 0

/** Abzug pro verpasstem Intervall, sobald die Karenz abgelaufen ist. */
export const HEALTH_PENALTY_PER_MISSED_INTERVAL = 25

/**
 * Karenz in Intervallen: so lange bleibt eine fällige Pflanze bei voller
 * Gesundheit ("durstig"), bevor der Verfall einsetzt.
 */
export const GRACE_INTERVALS = 1

/** Grenzen für einen eigenen Rhythmus. */
export const MIN_INTERVAL_DAYS = 1
export const MAX_INTERVAL_DAYS = 30

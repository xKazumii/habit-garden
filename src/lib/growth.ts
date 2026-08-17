/**
 * Wachstums- und Verwelklogik. Der Kern der App.
 *
 * Bewusst frei von UI-, DOM- und Datenbank-Abhängigkeiten und komplett
 * deterministisch: jede Funktion bekommt `now` übergeben.
 *
 * Der wichtigste Grundsatz: **es gibt keine Timer.** Gesundheit, Stufe, Streak
 * und Status werden immer aus den gespeicherten Zeitstempeln berechnet. Eine App,
 * die drei Wochen geschlossen war, ergibt beim Öffnen genau denselben Zustand wie
 * eine, die durchgehend offen stand.
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

/** Schützt die Division in `missedIntervalsFor` gegen kaputte Daten. */
const safeIntervalDays = (intervalDays: number): number =>
  Number.isFinite(intervalDays) ? Math.max(MIN_INTERVAL_DAYS, Math.trunc(intervalDays)) : MIN_INTERVAL_DAYS

/**
 * Wie viele Intervalle sind verpasst, wenn eine Pflanze `daysOverdue` Kalendertage
 * über ihrem Fälligkeitstag liegt?
 *
 * Während der Karenz 0 — die Pflanze ist dann "durstig", aber bei voller
 * Gesundheit. Erst danach zählt jedes weitere Intervall.
 *
 * Dieselbe Funktion bewertet auch vergangene Gießabstände beim Streak. Dadurch
 * können Gesundheit und Streak nicht auseinanderlaufen: genau der Abstand, der
 * Gesundheit kostet, kostet auch den Streak.
 */
export const missedIntervalsFor = (daysOverdue: number, intervalDays: number): number => {
  if (daysOverdue < 0) return 0
  const interval = safeIntervalDays(intervalDays)
  const intervalsOverdue = Math.floor(daysOverdue / interval)
  return Math.max(0, intervalsOverdue - GRACE_INTERVALS + 1)
}

/** Punkte, die eine Stufe dieser Kategorie kostet. */
export const pointsPerStageFor = (category: PlantCategory): number => POINTS_PER_STAGE[category]

export const growthStageFor = (category: PlantCategory, growthPoints: number): GrowthStage => {
  const perStage = pointsPerStageFor(category)
  const stage = Math.floor(Math.max(0, growthPoints) / perStage)
  return clamp(stage, 0, MAX_GROWTH_STAGE) as GrowthStage
}

/**
 * Kalendertag, ab dem gegossen werden darf.
 * Eine frisch gepflanzte Pflanze (`lastWateredAt === null`) ist sofort fällig.
 */
const dueDayNumber = (plant: Plant, intervalDays: number): number =>
  plant.lastWateredAt === null
    ? dayNumber(plant.createdAt)
    : dayNumber(plant.lastWateredAt) + intervalDays

/** Zeitstempel der lokalen Mitternacht des Fälligkeitstags — nur zur Anzeige. */
const dueAtFor = (plant: Plant, intervalDays: number): number =>
  plant.lastWateredAt === null
    ? startOfLocalDayPlus(plant.createdAt, 0)
    : startOfLocalDayPlus(plant.lastWateredAt, intervalDays)

/**
 * Aufeinanderfolgende Intervalle ohne Verpassen.
 *
 * Zwei Abbruchbedingungen:
 *  - die Pflanze hängt *aktuell* über der Karenz (oder ist eingegangen) → 0
 *  - im Verlauf liegt ein Abstand, der über die Karenz hinausging
 *
 * Damit gilt genau, was die Spec verlangt: das Gießen einer welken Pflanze
 * stellt die Gesundheit wieder her, kostet aber den Streak.
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
 * Präzedenz statt Schwellwert.
 *
 * Die Spec nennt "gesund (>66)", was mit den 25er-Schritten kollidiert: eine
 * Pflanze mit 75 wäre gleichzeitig gesund und ein Intervall überfällig. Deshalb
 * wird der Zustand hier über eine klare Reihenfolge bestimmt, die keine Lücke
 * lässt: eingegangen → welk → durstig → gesund.
 */
const healthStateFor = (status: PlantStatus, health: number, isDue: boolean): HealthState => {
  if (status === 'dead') return 'dead'
  if (health < MAX_HEALTH) return 'wilting'
  if (isDue) return 'thirsty'
  return 'healthy'
}

/**
 * Der komplette abgeleitete Zustand einer Pflanze. Nichts davon wird gespeichert.
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
   * `status` ist in der Datenbank absichtlich klebrig: einmal eingegangen,
   * immer eingegangen. Sonst könnte ein späteres Verlängern des Intervalls im
   * Bearbeiten-Flow eine tote Pflanze wiederbeleben.
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
    // Bewusst als Differenz, nicht als `-daysOverdue`: das ergäbe bei genau
    // heute fälligen Pflanzen -0.
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

/** Gießen erlaubt: die Pflanze lebt und ist fällig. */
export const canWater = (plant: Plant, now: number = Date.now()): boolean =>
  derivePlantState(plant, now).isDue

/**
 * Gießt die Pflanze und gibt eine *neue* Pflanze zurück — kein Mutieren.
 *
 * Höchstens einmal pro Intervall ergibt sich automatisch: der nächste
 * Fälligkeitstag folgt aus `lastWateredAt`, das hier neu gesetzt wird.
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
 * Schreibt einen erkannten Tod in das persistierte Feld zurück.
 * Gibt dieselbe Referenz zurück, wenn sich nichts ändert — die Datenschicht
 * kann darauf prüfen und sich den Schreibvorgang sparen.
 */
export const reconcileStatus = (plant: Plant, now: number = Date.now()): Plant => {
  const { status } = derivePlantState(plant, now)
  return status === plant.status ? plant : { ...plant, status }
}

export const countDue = (plants: readonly Plant[], now: number = Date.now()): number =>
  plants.reduce((total, plant) => (canWater(plant, now) ? total + 1 : total), 0)

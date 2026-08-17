import type { GrowthStage, HealthState, PlantCategory } from '../types'
import { t, type MessageKey } from './index'

/**
 * Wiederkehrende Beschriftungen, die aus Daten entstehen.
 *
 * Damit steht die Zuordnung „Stufe 3 heißt Ausgewachsen" genau an einer Stelle
 * und nicht in jedem Screen erneut.
 */

/** Indiziert mit `GrowthStage` (0–4). */
const STAGE_KEYS: Readonly<Record<GrowthStage, MessageKey>> = {
  0: 'stage.seed',
  1: 'stage.sprout',
  2: 'stage.young',
  3: 'stage.grown',
  4: 'stage.blooming',
}

/** Rhythmen mit eigenem Wort. Alles andere wird ausgeschrieben. */
const RHYTHM_KEYS: Readonly<Record<number, MessageKey>> = {
  1: 'rhythm.daily',
  2: 'rhythm.every2',
  3: 'rhythm.every3',
  7: 'rhythm.weekly',
}

export const stageLabel = (stage: GrowthStage): string => t(STAGE_KEYS[stage])

export const healthLabel = (state: HealthState): string => t(`health.${state}`)

export const categoryName = (category: PlantCategory): string => t(`category.${category}.name`)

export const categoryHint = (category: PlantCategory): string => t(`category.${category}.hint`)

/**
 * `Plant.species` ist im Datenmodell ein freier String — ein Import könnte eine
 * unbekannte Art mitbringen. Deshalb die Zusicherung: `t()` fällt bei einem
 * unbekannten Schlüssel sichtbar auf ihn selbst zurück und warnt im Dev-Modus.
 */
export const speciesName = (id: string): string => t(`species.${id}.name` as MessageKey)

export const rhythmLabel = (intervalDays: number): string => {
  const key = RHYTHM_KEYS[intervalDays]
  return key ? t(key) : t('rhythm.everyN', { count: intervalDays })
}

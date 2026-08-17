import type { GrowthStage, HealthState, PlantCategory } from '../types'
import { t, type MessageKey } from './index'

/**
 * Recurring labels that are derived from data.
 *
 * Keeps the mapping "stage 3 is called grown" in exactly one place instead of
 * repeating it in every screen.
 */

/** Indexed by `GrowthStage` (0–4). */
const STAGE_KEYS: Readonly<Record<GrowthStage, MessageKey>> = {
  0: 'stage.seed',
  1: 'stage.sprout',
  2: 'stage.young',
  3: 'stage.grown',
  4: 'stage.blooming',
}

/** Rhythms that have their own word. Everything else is spelled out. */
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
 * `Plant.species` is a free-form string in the data model — an import could
 * bring an unknown species. Hence the assertion: for an unknown key `t()` visibly
 * falls back to the key itself and warns in dev mode.
 */
export const speciesName = (id: string): string => t(`species.${id}.name` as MessageKey)

export const rhythmLabel = (intervalDays: number): string => {
  const key = RHYTHM_KEYS[intervalDays]
  return key ? t(key) : t('rhythm.everyN', { count: intervalDays })
}

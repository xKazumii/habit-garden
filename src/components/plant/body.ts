import { GROWTH_FACTOR } from '../../config/plant-visuals'
import { mix } from '../../lib/color'
import type { GrowthStage } from '../../types'
import type { PaintRegistry } from './paint'

/**
 * What every drawing function needs to know, and the two derived colours all
 * three categories share.
 */

export interface BodyContext {
  /** 0–4. The drawing functions are only called from stage 1 on. */
  growthStage: GrowthStage
  /** `GROWTH_FACTOR[growthStage]` — passed in so it is computed once. */
  growth: number
  /** Extra angle bending leaves downwards. */
  droop: number
  detail: boolean
  /** Per-species seed for every irregularity. */
  seed: number
  paint: PaintRegistry
}

export const growthFor = (stage: GrowthStage): number => GROWTH_FACTOR[stage]

/** The shaded variant of a leaf colour, used for stems and back-facing masses. */
export const shadeOf = (leaf: string): string => mix(leaf, -0.22)

/**
 * The lit variant. Herbs and flowers carry their own second leaf colour;
 * for trees it is derived, because their palette has no second green.
 */
export const litOf = (leaf: string, leafLight?: string): string =>
  leafLight ?? mix(leaf, 0.2)

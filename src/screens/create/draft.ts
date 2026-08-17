import { DEFAULT_INTERVAL_DAYS } from '../../config/rhythms'
import type { PlantCategory } from '../../types'

/**
 * The draft the planting flow carries across its three steps.
 * It only becomes a `NewPlantInput` when the plant is actually created.
 */
export interface PlantDraft {
  category: PlantCategory | null
  species: string | null
  habitName: string
  intervalDays: number
  /**
   * "Custom value" is active — even when the number happens to match a preset.
   * Otherwise the selection would jump back while typing a "7".
   */
  usesCustomRhythm: boolean
}

export const emptyDraft = (): PlantDraft => ({
  category: null,
  species: null,
  habitName: '',
  intervalDays: DEFAULT_INTERVAL_DAYS,
  usesCustomRhythm: false,
})

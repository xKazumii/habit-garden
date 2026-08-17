import { DEFAULT_INTERVAL_DAYS } from '../../config/rhythms'
import type { PlantCategory } from '../../types'

/**
 * Der Entwurf, den der Anpflanz-Flow über seine drei Schritte trägt.
 * Erst beim Einpflanzen wird daraus ein `NewPlantInput`.
 */
export interface PlantDraft {
  category: PlantCategory | null
  species: string | null
  habitName: string
  intervalDays: number
  /**
   * „Eigener Wert" ist aktiv — auch wenn die Zahl zufällig einem Preset
   * entspricht. Sonst würde die Auswahl beim Tippen von „7" zurückspringen.
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

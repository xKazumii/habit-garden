import type { PlantCategory } from '../types'

export interface SpeciesDefinition {
  /** Stabiler Schlüssel — landet so in der Datenbank und in den i18n-Keys. */
  id: string
  category: PlantCategory
}

/**
 * Phase 1: drei Arten, eine pro Kategorie. Die Namen liegen in src/i18n/de.ts
 * unter species.<id>.name, damit hier keine sichtbaren Strings stehen.
 */
export const SPECIES: readonly SpeciesDefinition[] = [
  { id: 'basil', category: 'herb' },
  { id: 'sunflower', category: 'flower' },
  { id: 'oak', category: 'tree' },
]

export const CATEGORY_ORDER: readonly PlantCategory[] = ['herb', 'flower', 'tree']

export const speciesById = (id: string): SpeciesDefinition | undefined =>
  SPECIES.find((species) => species.id === id)

export const speciesByCategory = (category: PlantCategory): readonly SpeciesDefinition[] =>
  SPECIES.filter((species) => species.category === category)

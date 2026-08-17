import type { PlantCategory } from '../types'

/**
 * Kategorien und Arten.
 *
 * Artspezifisch sind ausschließlich Farben und ein paar Formzahlen — die
 * Bauanleitung der Illustration ist prozedural und steht in
 * src/components/plant/. Eine neue Art ist damit reine Konfiguration:
 * hier ein Eintrag, in src/i18n/de.ts ein Name.
 *
 * Alle Werte stammen aus dem Design-Prototyp.
 */

/** Kraut: zwei bis drei Stängel mit Blattpaaren, auf der höchsten Stufe Blüten. */
export interface HerbVisual {
  /** Stängel und die zum Betrachter zeigende Blatthälfte. */
  leaf: string
  /** Hellere, abgewandte Blatthälfte. */
  leafLight: string
  /** Blütenpunkte auf Stufe 4. */
  bloom: string
}

/** Blume: ein Stängel, zwei Blätter, Knospe die sich auf Stufe 4 öffnet. */
export interface FlowerVisual {
  leaf: string
  leafLight: string
  /** Blütenblätter. */
  bloom: string
  /** Blütenmitte. */
  center: string
  petals: number
  petalWidth: number
  petalHeight: number
}

/** Baum: Stamm als Trapez, ab Stufe 2 drei Kronenkreise, auf Stufe 4 Früchte. */
export interface TreeVisual {
  leaf: string
  leafLight: string
  trunk: string
  fruit: string
}

/**
 * Diskriminiert über `category`: die Kategorie entscheidet, welche Formzahlen
 * eine Art überhaupt kennt. Ein Baum hat keine Blütenblätter, und der
 * Typechecker weiß das.
 */
export type SpeciesDefinition =
  | { id: string; category: Extract<PlantCategory, 'herb'>; visual: HerbVisual }
  | { id: string; category: Extract<PlantCategory, 'flower'>; visual: FlowerVisual }
  | { id: string; category: Extract<PlantCategory, 'tree'>; visual: TreeVisual }

/**
 * Phase 1 hat drei Arten, eine pro Kategorie. Die Namen liegen in
 * src/i18n/de.ts unter species.<id>.name, damit hier keine sichtbaren
 * Strings stehen.
 */
export const SPECIES: readonly SpeciesDefinition[] = [
  {
    id: 'basil',
    category: 'herb',
    visual: { leaf: '#6E9A6B', leafLight: '#87AE7F', bloom: '#EFEBDD' },
  },
  {
    id: 'sunflower',
    category: 'flower',
    visual: {
      leaf: '#6E9A6B',
      leafLight: '#87AE7F',
      bloom: '#E8B44A',
      center: '#8A5A33',
      petals: 12,
      petalWidth: 5,
      petalHeight: 11,
    },
  },
  {
    id: 'oak',
    category: 'tree',
    visual: { leaf: '#6E8F63', leafLight: '#83A575', trunk: '#8C6A4F', fruit: '#B07C43' },
  },
]

export const CATEGORY_ORDER: readonly PlantCategory[] = ['herb', 'flower', 'tree']

export const speciesById = (id: string): SpeciesDefinition | undefined =>
  SPECIES.find((species) => species.id === id)

export const speciesByCategory = (category: PlantCategory): readonly SpeciesDefinition[] =>
  SPECIES.filter((species) => species.category === category)

/** Erste Art einer Kategorie — die Vorauswahl im Anpflanz-Flow. */
export const defaultSpeciesFor = (category: PlantCategory): SpeciesDefinition | undefined =>
  speciesByCategory(category)[0]

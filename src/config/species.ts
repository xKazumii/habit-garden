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

/**
 * Wie ein Kraut auf Stufe 4 blüht.
 * `dot` ist ein Punkt je Stängel, `spike` eine nach oben schmaler werdende
 * Ähre — Lavendel.
 */
export type HerbBloomStyle = 'dot' | 'spike'

/** Kraut: zwei bis drei Stängel mit Blattpaaren, auf der höchsten Stufe Blüten. */
export interface HerbVisual {
  /** Stängel und die zum Betrachter zeigende Blatthälfte. */
  leaf: string
  /** Hellere, abgewandte Blatthälfte. */
  leafLight: string
  /** Blütenfarbe auf Stufe 4. */
  bloom: string
  /** Ohne Angabe `dot`. */
  bloomStyle?: HerbBloomStyle
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
 * Neun Arten, drei pro Kategorie. Die Reihenfolge bestimmt die Anzeige im
 * Anpflanz-Flow und über `defaultSpeciesFor()` die Vorauswahl.
 *
 * Die Namen liegen in src/i18n/de.ts unter species.<id>.name, damit hier keine
 * sichtbaren Strings stehen.
 */
export const SPECIES: readonly SpeciesDefinition[] = [
  {
    id: 'basil',
    category: 'herb',
    visual: { leaf: '#6E9A6B', leafLight: '#87AE7F', bloom: '#EFEBDD' },
  },
  {
    id: 'mint',
    category: 'herb',
    visual: { leaf: '#5F9370', leafLight: '#7FB08C', bloom: '#E4EFE6' },
  },
  {
    id: 'lavender',
    category: 'herb',
    visual: { leaf: '#8AA98E', leafLight: '#A3BCA4', bloom: '#9B8CC4', bloomStyle: 'spike' },
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
    id: 'tulip',
    category: 'flower',
    visual: {
      leaf: '#7FA482',
      leafLight: '#93B394',
      bloom: '#D07A8C',
      center: '#C4667A',
      petals: 3,
      petalWidth: 7,
      petalHeight: 12,
    },
  },
  {
    id: 'poppy',
    category: 'flower',
    visual: {
      leaf: '#8AA98E',
      leafLight: '#9CB79C',
      bloom: '#D0604F',
      center: '#3A3630',
      petals: 5,
      petalWidth: 7.5,
      petalHeight: 10,
    },
  },
  {
    id: 'oak',
    category: 'tree',
    visual: { leaf: '#6E8F63', leafLight: '#83A575', trunk: '#8C6A4F', fruit: '#B07C43' },
  },
  {
    /* Die hellere Kronenhälfte ist rosa — das liest sich als Blütenbaum. */
    id: 'cherry',
    category: 'tree',
    visual: { leaf: '#8FB183', leafLight: '#F0BFCB', trunk: '#96725A', fruit: '#D4566B' },
  },
  {
    id: 'olive',
    category: 'tree',
    visual: { leaf: '#8AA286', leafLight: '#A6BBA0', trunk: '#9C8264', fruit: '#4B5B3C' },
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

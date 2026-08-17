import type { PlantCategory } from '../types'

/**
 * Categories, species and their prices.
 *
 * The only species-specific values are colours, a few shape flags, the seed
 * shape and the price — the drawing recipe is procedural and lives in
 * src/components/plant/. A new species is therefore pure configuration: one
 * entry here and a name in src/i18n/de.ts.
 *
 * All colours and flags come from the design prototype. Price 0 means starter
 * species, available immediately; everything else is unlocked in the seed shop.
 * Moving a species between the two only takes changing its price — there is no
 * second list.
 *
 * The pricing calibration lives in src/config/economy.ts.
 */

/**
 * The shape of the seed shown at stage 0, and again as an empty husk at stage 1
 * for trees and bulbs. Fourteen shapes across thirty species — a lemon pip does
 * not look like an acorn.
 */
export type SeedShape =
  | 'tiny'
  | 'oval'
  | 'striped'
  | 'bulb'
  | 'pod'
  | 'crescent'
  | 'husk'
  | 'tuber'
  | 'acorn'
  | 'pit'
  | 'wing'
  | 'cone'
  | 'pip'
  | 'nut'

/**
 * How a herb blooms at stage 4.
 * `dot` is a small four-petal blossom per stem, `spike` is a spike that narrows
 * towards the top — lavender, rosemary, thyme.
 */
export type HerbBloomStyle = 'dot' | 'spike'

/**
 * The build of a herb.
 * `narrow` is tall with blade-like leaves (chives, rosemary), `small` stays low
 * with tiny leaves (thyme, oregano), `broad` has wide leaves (sage, lemon balm).
 */
export type HerbForm = 'normal' | 'narrow' | 'small' | 'broad'

/** Herb: one to six stems with leaf pairs, blossoms at the highest stage. */
export interface HerbVisual {
  /** Stem and the leaf half facing the viewer. */
  leaf: string
  /** Lighter leaf half, facing away. */
  leafLight: string
  /** Blossom colour at stage 4. */
  bloom: string
  /** Defaults to `dot`. */
  bloomStyle?: HerbBloomStyle
  /** Defaults to `normal`. */
  form?: HerbForm
  /** A second, smaller pair of leaves per node — parsley. */
  frilly?: boolean
}

/** Flower: a basal rosette, one to five stems, blossoms opening at stage 4. */
export interface FlowerVisual {
  leaf: string
  leafLight: string
  /** Petals. */
  bloom: string
  /** Flower centre. */
  center: string
  petals: number
  petalWidth: number
  /**
   * Petal height. Below 8 the species is drawn as a cluster — more stems with
   * smaller blossoms, the way forget-me-nots grow.
   */
  petalHeight: number
}

/** Tree: flared trunk, branches and an organic crown, fruit at stage 4. */
export interface TreeVisual {
  leaf: string
  leafLight: string
  trunk: string
  fruit: string
  /** Narrower crown — birch, ginkgo. */
  slim?: boolean
  /** Tiered conifer instead of a round crown — pine. */
  conifer?: boolean
  /** Blossom dots scattered through the crown from stage 3 — cherry. */
  blossoms?: boolean
  /**
   * Horizontal bark dashes instead of a vertical shading line — birch.
   * A flag rather than a comparison against the trunk colour: colour checks
   * break silently the moment someone retunes the palette.
   */
  paleBark?: boolean
}

interface SpeciesBase {
  id: string
  /** 0 = starter species. Otherwise the price in the seed shop. */
  price: number
  seed: SeedShape
}

/**
 * Discriminated by `category`: the category decides which shape numbers a
 * species even has. A tree has no petals, and the type checker knows it.
 */
export type SpeciesDefinition =
  | (SpeciesBase & { category: Extract<PlantCategory, 'herb'>; visual: HerbVisual })
  | (SpeciesBase & { category: Extract<PlantCategory, 'flower'>; visual: FlowerVisual })
  | (SpeciesBase & { category: Extract<PlantCategory, 'tree'>; visual: TreeVisual })

/**
 * Ten species per category, ordered by ascending price within each category.
 * The order drives the shop listing and, via `defaultSpeciesFor()`, the
 * preselection in the planting flow — which is why the starters come first.
 */
export const SPECIES: readonly SpeciesDefinition[] = [
  // Herbs
  {
    id: 'parsley',
    category: 'herb',
    price: 0,
    seed: 'oval',
    visual: { leaf: '#4F8A54', leafLight: '#6BA46D', bloom: '#E9EFDC', frilly: true },
  },
  {
    id: 'mint',
    category: 'herb',
    price: 0,
    seed: 'tiny',
    visual: { leaf: '#5F9370', leafLight: '#7FB08C', bloom: '#E4EFE6' },
  },
  {
    id: 'basil',
    category: 'herb',
    price: 15,
    seed: 'tiny',
    visual: { leaf: '#6E9A6B', leafLight: '#87AE7F', bloom: '#EFEBDD' },
  },
  {
    id: 'chives',
    category: 'herb',
    price: 30,
    seed: 'tiny',
    visual: { leaf: '#5C8F6A', leafLight: '#74A47F', bloom: '#B48FC4', form: 'narrow' },
  },
  {
    id: 'oregano',
    category: 'herb',
    price: 45,
    seed: 'tiny',
    visual: { leaf: '#7C9668', leafLight: '#93AB7F', bloom: '#E4D6E6', form: 'small' },
  },
  {
    id: 'thyme',
    category: 'herb',
    price: 60,
    seed: 'tiny',
    visual: {
      leaf: '#78916E',
      leafLight: '#8DA582',
      bloom: '#C6A2C0',
      bloomStyle: 'spike',
      form: 'small',
    },
  },
  {
    id: 'sage',
    category: 'herb',
    price: 80,
    seed: 'oval',
    visual: { leaf: '#93A88F', leafLight: '#AFC0A9', bloom: '#B7A4CC', form: 'broad' },
  },
  {
    id: 'lemonbalm',
    category: 'herb',
    price: 105,
    seed: 'oval',
    visual: { leaf: '#7FA45F', leafLight: '#9BBC78', bloom: '#F2EEC9', form: 'broad' },
  },
  {
    id: 'rosemary',
    category: 'herb',
    price: 135,
    seed: 'tiny',
    visual: {
      leaf: '#5E7F63',
      leafLight: '#76957A',
      bloom: '#AEC0D6',
      bloomStyle: 'spike',
      form: 'narrow',
    },
  },
  {
    id: 'lavender',
    category: 'herb',
    price: 175,
    seed: 'tiny',
    visual: { leaf: '#8AA98E', leafLight: '#A3BCA4', bloom: '#9B8CC4', bloomStyle: 'spike' },
  },

  // Flowers
  {
    id: 'daisy',
    category: 'flower',
    price: 0,
    seed: 'tiny',
    visual: {
      leaf: '#79A06E',
      leafLight: '#90B385',
      bloom: '#F6F1E6',
      center: '#E5B948',
      petals: 11,
      petalWidth: 3.6,
      petalHeight: 8,
    },
  },
  {
    id: 'sunflower',
    category: 'flower',
    price: 0,
    seed: 'striped',
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
    id: 'marigold',
    category: 'flower',
    price: 25,
    seed: 'crescent',
    visual: {
      leaf: '#7B9B6B',
      leafLight: '#93B182',
      bloom: '#E09449',
      center: '#B4682F',
      petals: 10,
      petalWidth: 5,
      petalHeight: 9.5,
    },
  },
  {
    id: 'cornflower',
    category: 'flower',
    price: 40,
    seed: 'husk',
    visual: {
      leaf: '#8FA98A',
      leafLight: '#A5BC9F',
      bloom: '#7A93C4',
      center: '#4F5F8C',
      petals: 8,
      petalWidth: 4.5,
      petalHeight: 9,
    },
  },
  {
    id: 'forgetmenot',
    category: 'flower',
    price: 55,
    seed: 'tiny',
    visual: {
      leaf: '#87A47F',
      leafLight: '#9DB795',
      bloom: '#8FA9BF',
      center: '#EBD98F',
      petals: 5,
      petalWidth: 4,
      petalHeight: 6.5,
    },
  },
  {
    id: 'poppy',
    category: 'flower',
    price: 75,
    seed: 'pod',
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
    id: 'cosmos',
    category: 'flower',
    price: 95,
    seed: 'crescent',
    visual: {
      leaf: '#8DAA88',
      leafLight: '#A3BE9D',
      bloom: '#DFA0B8',
      center: '#E8C860',
      petals: 8,
      petalWidth: 5.5,
      petalHeight: 9.5,
    },
  },
  {
    id: 'crocus',
    category: 'flower',
    price: 125,
    seed: 'bulb',
    visual: {
      leaf: '#7FA07C',
      leafLight: '#95B392',
      bloom: '#9E86C8',
      center: '#E0C258',
      petals: 4,
      petalWidth: 5.5,
      petalHeight: 11,
    },
  },
  {
    id: 'tulip',
    category: 'flower',
    price: 160,
    seed: 'bulb',
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
    id: 'dahlia',
    category: 'flower',
    price: 205,
    seed: 'tuber',
    visual: {
      leaf: '#6F9370',
      leafLight: '#87A886',
      bloom: '#C2698F',
      center: '#F0DCC2',
      petals: 14,
      petalWidth: 4.2,
      petalHeight: 10.5,
    },
  },

  // Trees
  {
    id: 'oak',
    category: 'tree',
    price: 0,
    seed: 'acorn',
    visual: { leaf: '#6E8F63', leafLight: '#83A575', trunk: '#8C6A4F', fruit: '#B07C43' },
  },
  {
    id: 'birch',
    category: 'tree',
    price: 0,
    seed: 'wing',
    visual: {
      leaf: '#93B57F',
      leafLight: '#A9C694',
      trunk: '#DED8CA',
      fruit: '#C8CE9E',
      slim: true,
      paleBark: true,
    },
  },
  {
    id: 'pine',
    category: 'tree',
    price: 35,
    seed: 'cone',
    visual: {
      leaf: '#4E6E55',
      leafLight: '#628265',
      trunk: '#7E5F49',
      fruit: '#7A5B3E',
      conifer: true,
    },
  },
  {
    id: 'maple',
    category: 'tree',
    price: 50,
    seed: 'wing',
    visual: { leaf: '#B4763F', leafLight: '#D0995A', trunk: '#8A6B54', fruit: '#C4633C' },
  },
  {
    id: 'apple',
    category: 'tree',
    price: 70,
    seed: 'pip',
    visual: { leaf: '#75A067', leafLight: '#8CB37B', trunk: '#8E6C51', fruit: '#CC5B4B' },
  },
  {
    id: 'fig',
    category: 'tree',
    price: 95,
    seed: 'pod',
    visual: { leaf: '#7C9A6A', leafLight: '#94AF80', trunk: '#A08468', fruit: '#7B5E88' },
  },
  {
    id: 'olive',
    category: 'tree',
    price: 125,
    seed: 'pit',
    visual: { leaf: '#8AA286', leafLight: '#A6BBA0', trunk: '#9C8264', fruit: '#4B5B3C' },
  },
  {
    id: 'lemon',
    category: 'tree',
    price: 165,
    seed: 'pip',
    visual: { leaf: '#6F9663', leafLight: '#87AB78', trunk: '#94745A', fruit: '#E3C24E' },
  },
  {
    id: 'cherry',
    category: 'tree',
    price: 215,
    seed: 'pit',
    visual: {
      leaf: '#8FB183',
      leafLight: '#F0BFCB',
      trunk: '#96725A',
      fruit: '#D4566B',
      blossoms: true,
    },
  },
  {
    id: 'ginkgo',
    category: 'tree',
    price: 275,
    seed: 'nut',
    visual: {
      leaf: '#C0B44E',
      leafLight: '#D6CB6D',
      trunk: '#8F7A60',
      fruit: '#D9C77A',
      slim: true,
    },
  },
]

export const CATEGORY_ORDER: readonly PlantCategory[] = ['herb', 'flower', 'tree']

export const speciesById = (id: string): SpeciesDefinition | undefined =>
  SPECIES.find((species) => species.id === id)

export const speciesByCategory = (category: PlantCategory): readonly SpeciesDefinition[] =>
  SPECIES.filter((species) => species.category === category)

/** Price of a species. `undefined` for an unknown species. */
export const priceOf = (id: string): number | undefined => speciesById(id)?.price

/** Species that are available from the start. */
export const STARTER_SPECIES_IDS: readonly string[] = SPECIES.filter(
  (species) => species.price === 0,
).map((species) => species.id)

/** First starter species of a category — the preselection in the planting flow. */
export const defaultSpeciesFor = (category: PlantCategory): SpeciesDefinition | undefined =>
  speciesByCategory(category).find((species) => species.price === 0)

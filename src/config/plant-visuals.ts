import type { GrowthStage, HealthState } from '../types'

/**
 * Dimensions and state rules of the plant illustration.
 *
 * All values come from the design prototype. The illustration is procedural:
 * stage and health are two independent axes, there are no drawn variants. The
 * stage scales the geometry, health recolours the palette and makes the leaves
 * droop.
 */

/** Canvas. Taller than wide so there is room above the plant for the hint. */
export const PLANT_VIEWBOX = '0 0 100 116'
export const PLANT_ASPECT = 1.16

/** Centre and ground line — the base point every plant is anchored to. */
export const CENTER_X = 50
export const GROUND_Y = 106

/**
 * How far the whole plant is lifted out of the soil mound.
 *
 * The mound peaks at 89.5 but the plant is anchored at `GROUND_Y` (106), so
 * without this the lower 16 units of stem would run down the face of the mound
 * and the plant would read as standing *in front of* the hill. The design
 * solves it here rather than by flattening the mound.
 */
export const PLANT_LIFT_Y = 10.5

/** Pivot for the sway, lifted along with the plant. */
export const SWAY_ORIGIN_Y = 96

/**
 * Below this width the fine detail is skipped: leaf veins, pebbles, gradients,
 * sparkles. At 44px none of it is visible anyway, and the bed renders twenty
 * plants at once.
 */
export const DETAIL_MIN_SIZE = 72

/**
 * Growth factor per stage, indexed by `growthStage` (0–4).
 * Scales height, leaf size and crown radius.
 */
export const GROWTH_FACTOR: Readonly<Record<GrowthStage, number>> = {
  0: 0,
  1: 0.16,
  2: 0.44,
  3: 0.75,
  4: 1,
}

/**
 * How a health state changes the drawing.
 *
 * Deliberately fully data-driven: the drawing functions decide nothing
 * themselves, they read from here. A new state would be a new entry.
 *
 * Note there is no CSS filter any more. Health recolours the palette itself
 * (`tint`) and bends the leaves down (`droop`) — that only touches the plant,
 * not the soil, and reads far more organically than desaturating the result.
 */
export interface HealthTint {
  /** Colour the palette is blended towards. */
  target: string
  /** Share for leaves and stems. */
  foliage: number
  /** Share for blossoms, centres and fruit — kept lower so colour survives. */
  bloom: number
}

export interface HealthRender {
  /** Tilt around the base point, in degrees. Negative leans towards the viewer. */
  rotation: number
  opacity: number
  /** Extra angle bending every leaf downwards. 0 = upright. */
  droop: number
  /** `null` for healthy — nothing is recoloured. */
  tint: HealthTint | null
  /** Vertical squash around the base point. 1 = none. */
  squash: number
  /** Slight widening that goes with the squash, so volume is preserved. */
  spread: number
  /** Living plants sway, wilting and dead ones do not. */
  sways: boolean
  /** Droplet hint above the plant. */
  showsDropHint: boolean
  /** Dry, lighter soil with cracks and fallen leaves. */
  drySoil: boolean
}

export const HEALTH_RENDER: Readonly<Record<HealthState, HealthRender>> = {
  healthy: {
    rotation: 0,
    opacity: 1,
    droop: 0,
    tint: null,
    squash: 1,
    spread: 1,
    sways: true,
    showsDropHint: false,
    drySoil: false,
  },
  thirsty: {
    rotation: -3,
    opacity: 1,
    droop: 13,
    tint: { target: '#C9C293', foliage: 0.24, bloom: 0.14 },
    squash: 1,
    spread: 1,
    sways: true,
    showsDropHint: true,
    drySoil: false,
  },
  wilting: {
    rotation: 7,
    opacity: 0.96,
    droop: 36,
    tint: { target: '#8B6636', foliage: 0.62, bloom: 0.48 },
    squash: 0.82,
    spread: 1.05,
    sways: false,
    showsDropHint: false,
    drySoil: true,
  },
  /*
   * Further than wilting in every direction: colour almost gone, deeply bent.
   *
   * Note what is deliberately NOT here: the plant keeps every leaf and its full
   * crown. The design calls wilting "entsättigt, bräunlich" — a statement about
   * colour, not a structural collapse. An earlier attempt also shrank leaves and
   * dropped nodes, which turned a wilting herb into bare stalks.
   */
  dead: {
    rotation: 9,
    opacity: 0.88,
    droop: 48,
    tint: { target: '#6E5A44', foliage: 0.82, bloom: 0.7 },
    squash: 0.72,
    spread: 1.08,
    sways: false,
    showsDropHint: false,
    drySoil: true,
  },
}

/** The trunk is blended towards this instead of the tint target — wood greys. */
export const TRUNK_TINT_TARGET = '#8A7455'

/** Standard sizes so the screens do not invent numbers of their own. */
export const PLANT_SIZE = {
  /** Row in "Today". */
  row: 44,
  /** Already-done row in "Today" — smaller because it is ticked off. */
  rowDone: 36,
  /** Preview in the planting flow. */
  preview: 56,
  /** Tile in the species picker. */
  tile: 62,
  /** Category card in step 1. */
  category: 60,
  /** Tile in the bed. */
  bed: 74,
  /** Confirmation after planting. */
  planted: 120,
  /** Head of the detail sheet. */
  detail: 158,
} as const

/** Droplet in the top right corner when a plant is thirsty. */
export const DROP_HINT_PATH =
  'M86 12c3.4 4 5.2 6.3 5.2 8.4a5.2 5.2 0 1 1-10.4 0c0-2.1 1.8-4.4 5.2-8.4Z'
export const DROP_HINT_OPACITY = 0.95
export const DROP_HINT_GLINT = { cx: 84.4, cy: 19, rx: 1.1, ry: 1.6 } as const

/**
 * The same droplet, above the plant's centre — falls down while watering.
 * Only the start point differs, the rest of the path is relative.
 */
export const POUR_DROP_PATH =
  'M50 12c3.4 4 5.2 6.3 5.2 8.4a5.2 5.2 0 1 1-10.4 0c0-2.1 1.8-4.4 5.2-8.4Z'

/**
 * Duration of the falling droplet.
 * MUST match `--animate-drop` in src/index.css (`hg-drop 900ms`).
 */
export const POUR_DURATION_MS = 900

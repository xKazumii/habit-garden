/**
 * The coin. Colours and dimensions come from the design prototype.
 *
 * Gold stays gold — the values are deliberately theme-independent and therefore
 * live here rather than as CSS variables. It is stamped with the brand's sprout
 * so the coin belongs to this app instead of looking like play money.
 */

export const COIN_VIEWBOX = '0 0 100 100'

export const COIN_COLOR = {
  face: '#E7B94F',
  /** The rim peeking out below the face — gives the coin thickness. */
  rim: '#B9832C',
  /** Outline and the stamp stem. */
  ink: '#6E4A16',
  /**
   * Leaves and bud of the stamp. Deliberately lighter than `ink` — in the
   * outline colour they merge into a dark blob at small sizes.
   */
  emblem: '#9F7126',
  /** Highlight. */
  sheen: '#F6E0A0',
  /** Inner ring on the face. */
  ring: '#AB893A',
  shadow: 'rgba(46, 58, 50, 0.16)',
} as const

/** All dimensions relative to the radius, so the coin works at any size. */
export const COIN_GEOMETRY = {
  /** Downward offset of the rim disc. */
  rimOffset: 0.12,
  strokeWidth: 0.11,
  ringRadius: 0.74,
  ringWidth: 0.08,
  shadowOffset: 0.34,
  shadowRadiusX: 0.92,
  shadowRadiusY: 0.3,
  sheenWidth: 0.16,
  sheenOpacity: 0.9,
} as const

/** The stamp: stem, two leaves, bud — like the app mark. */
export const COIN_EMBLEM = {
  stemBottom: 0.46,
  stemTop: 0.42,
  stemBow: 0.05,
  stemWidth: 0.12,
  stemOpacity: 0.85,
  leafOffsetX: 0.26,
  leafRadiusX: 0.26,
  leafRadiusY: 0.115,
  leafTilt: 20,
  leftLeafY: -0.04,
  rightLeafY: -0.16,
  budY: 0.5,
  budRadius: 0.13,
} as const

/** One stacked coin per entry: offset and radius relative to the size. */
export const COIN_STACK: readonly { x: number; y: number; radius: number; emblem: boolean }[] = [
  { x: 0.02, y: 0.16, radius: 0.26, emblem: false },
  { x: -0.02, y: 0.02, radius: 0.26, emblem: false },
  { x: 0, y: -0.14, radius: 0.26, emblem: true },
]

export const COIN_SIZE = {
  /** Balance in the garden header and prices in the shop. */
  chip: 20,
  /** Reward after reaching a streak milestone. */
  reward: 30,
  /** Head of the seed shop. */
  hero: 84,
} as const

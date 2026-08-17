import type { ReactElement } from 'react'

import { CENTER_X, GROUND_Y } from '../../config/plant-visuals'
import type { HerbVisual } from '../../config/species'
import { mix } from '../../lib/color'
import { pseudoOffset } from '../../lib/pseudo-random'
import { litOf, shadeOf, type BodyContext } from './body'
import { drawLeaf, drawStem } from './shapes'

/**
 * Herb: a tuft of stems with paired leaves, blossoming at stage 4.
 *
 * The form flag decides the build. `narrow` grows tall with blade-like leaves
 * and skips stems entirely — chives are blades, not stalks.
 */

/** Full height per form. */
const HEIGHT = { normal: 58, narrow: 68, small: 46 } as const

const STEM_SPREAD = { normal: 13, narrow: 15 } as const
const SIDE_DROP = { normal: 7, narrow: 9 } as const
const LEAN = 4

/** Stage thresholds at which another set of stems appears. */
const SECOND_TIER_STAGE = 2
const THIRD_TIER_STAGE = 3
const BLOOMING_STAGE = 4

/** Leaf size per form: base plus the share that grows in. */
const LEAF_SIZE = {
  normal: { base: 6, grow: 5.6, ratio: 0.38 },
  broad: { base: 7.5, grow: 7, ratio: 0.48 },
  small: { base: 4.6, grow: 3.6, ratio: 0.38 },
  narrow: { base: 6, grow: 5.6, ratio: 0.24 },
} as const

/** Leaves are angled up; droop bends the pair back down. */
const LEAF_BASE_ANGLE = -30
const LEAF_ANGLE_STEP = 4
const DROOP_LEVERAGE = 1.6

const FRILL_SCALE = 0.66
const FRILL_LIFT = 1.6
const FRILL_ANGLE = 16

/** Spike blossom: stacked ellipses shrinking towards the tip. */
const SPIKE = {
  normal: { count: 5, radius: 2.6, gap: 4.4 },
  narrow: { count: 7, radius: 2.9, gap: 3.4 },
} as const
const SPIKE_SHRINK = 0.22
const SPIKE_JITTER = 1.6

/** Dot blossom: four petals around a small centre. */
const DOT = { petals: 4, rx: 2.2, ry: 3.4, lift: 6, centerRadius: 1.5 } as const

const stemCount = (growthStage: number, narrow: boolean): number => {
  if (narrow) {
    if (growthStage >= THIRD_TIER_STAGE) return 6
    return growthStage >= SECOND_TIER_STAGE ? 4 : 2
  }
  if (growthStage >= THIRD_TIER_STAGE) return 3
  return growthStage >= SECOND_TIER_STAGE ? 2 : 1
}

const nodeCount = (growthStage: number): number =>
  growthStage >= THIRD_TIER_STAGE ? 4 : growthStage >= SECOND_TIER_STAGE ? 3 : 2

/** Sideways position of stem `index`, from -1 (left) through 0 to 1 (right). */
const spreadOf = (index: number, count: number): number =>
  count > 1 ? (index / (count - 1) - 0.5) * 2 : 0

export const drawHerb = (visual: HerbVisual, context: BodyContext): ReactElement[] => {
  const { growthStage, growth, droop, detail, seed, paint } = context
  const form = visual.form ?? 'normal'
  const narrow = form === 'narrow'

  const shade = shadeOf(visual.leaf)
  const lit = litOf(visual.leaf, visual.leafLight)

  const height = HEIGHT[narrow ? 'narrow' : form === 'small' ? 'small' : 'normal']
  const top = GROUND_Y - height * growth
  const stems = stemCount(growthStage, narrow)
  const spreadWidth = narrow ? STEM_SPREAD.narrow : STEM_SPREAD.normal
  const sideDrop = narrow ? SIDE_DROP.narrow : SIDE_DROP.normal

  const elements: ReactElement[] = []

  /** Tip of stem `index`, without the wilting drop — blossoms sit on this. */
  const tipOf = (index: number) => {
    const spread = spreadOf(index, stems)
    return {
      spread,
      dx: spread * spreadWidth,
      lean: spread * LEAN,
      y: top + Math.abs(spread) * sideDrop,
    }
  }

  for (let index = 0; index < stems; index += 1) {
    const { dx, lean, y } = tipOf(index)
    const tipY = y

    if (narrow) {
      const half = 1.9 + 1.1 * growth
      elements.push(
        <path
          key={`blade-${index}`}
          d={
            `M${CENTER_X - half} ${GROUND_Y}` +
            ` Q${CENTER_X + dx * 0.2} ${(GROUND_Y + tipY) / 2} ${CENTER_X + dx + lean} ${tipY}` +
            ` Q${CENTER_X + dx * 0.5} ${(GROUND_Y + tipY) / 2 + 4} ${CENTER_X + half} ${GROUND_Y} Z`
          }
          fill={paint.fill(index % 2 ? lit : visual.leaf)}
        />,
      )
      continue
    }

    elements.push(
      drawStem({
        key: `stem-${index}`,
        fromX: CENTER_X,
        fromY: GROUND_Y,
        toX: CENTER_X + dx,
        toY: tipY,
        fromWidth: 1.5 + 0.9 * growth,
        toWidth: 0.8 + 0.5 * growth,
        bow: dx * 0.35,
        color: shade,
        paint,
      }),
    )

    const nodes = nodeCount(growthStage)
    const size = LEAF_SIZE[form === 'broad' ? 'broad' : form === 'small' ? 'small' : 'normal']

    for (let node = 0; node < nodes; node += 1) {
      const along = 0.32 + (node / (nodes - 0.001)) * 0.62
      const x = CENTER_X + dx * along
      const y2 = GROUND_Y - (GROUND_Y - tipY) * along

      const length = (size.base + size.grow * growth) * (1.05 - 0.22 * along)
      const width = length * size.ratio
      const up = LEAF_BASE_ANGLE + node * LEAF_ANGLE_STEP + droop * DROOP_LEVERAGE

      elements.push(
        drawLeaf({
          key: `leaf-a-${index}-${node}`,
          x,
          y: y2,
          angle: 180 - (up + droop),
          length,
          width,
          color: node % 2 ? lit : visual.leaf,
          detail,
          paint,
        }),
        drawLeaf({
          key: `leaf-b-${index}-${node}`,
          x,
          y: y2,
          angle: up + droop,
          length,
          width,
          color: node % 2 ? visual.leaf : lit,
          detail,
          paint,
        }),
      )

      if (visual.frilly && growthStage >= THIRD_TIER_STAGE) {
        const frillAngle = up - FRILL_ANGLE + droop
        elements.push(
          drawLeaf({
            key: `frill-a-${index}-${node}`,
            x,
            y: y2 - FRILL_LIFT,
            angle: 180 - frillAngle,
            length: length * FRILL_SCALE,
            width: width * 0.9,
            color: mix(visual.leaf, 0.12),
            detail,
            paint,
          }),
          drawLeaf({
            key: `frill-b-${index}-${node}`,
            x,
            y: y2 - FRILL_LIFT,
            angle: frillAngle,
            length: length * FRILL_SCALE,
            width: width * 0.9,
            color: mix(lit, -0.08),
            detail,
            paint,
          }),
        )
      }
    }
  }

  if (growthStage !== BLOOMING_STAGE) return elements

  const asSpike = visual.bloomStyle === 'spike' || narrow

  for (let index = 0; index < stems; index += 1) {
    const { dx, lean, y } = tipOf(index)
    const x = CENTER_X + dx + (narrow ? lean : 0)

    if (asSpike) {
      const spike = narrow ? SPIKE.narrow : SPIKE.normal
      for (let step = 0; step < spike.count; step += 1) {
        const radius = spike.radius - step * SPIKE_SHRINK
        elements.push(
          <ellipse
            key={`spike-${index}-${step}`}
            cx={x + pseudoOffset(seed + index * 9 + step) * SPIKE_JITTER}
            cy={y - 2 - step * spike.gap}
            rx={radius}
            ry={radius * 1.25}
            fill={paint.fill(step % 2 ? visual.bloom : mix(visual.bloom, -0.12))}
          />,
        )
      }
      continue
    }

    for (let petal = 0; petal < DOT.petals; petal += 1) {
      const angle = petal * (360 / DOT.petals) + 18
      elements.push(
        <ellipse
          key={`dot-${index}-${petal}`}
          cx={x}
          cy={y - DOT.lift}
          rx={DOT.rx}
          ry={DOT.ry}
          fill={paint.fill(visual.bloom)}
          transform={`rotate(${angle} ${x} ${y - 3})`}
        />,
      )
    }
    elements.push(
      <circle
        key={`dot-center-${index}`}
        cx={x}
        cy={y - 3}
        r={DOT.centerRadius}
        fill={paint.fill(mix(visual.bloom, -0.28))}
      />,
    )
  }

  return elements
}

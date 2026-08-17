import type { ReactElement } from 'react'

import { mix } from '../../lib/color'
import { pseudoRandom } from '../../lib/pseudo-random'
import type { GrowthStage } from '../../types'
import type { PaintRegistry } from './paint'

/**
 * The ground the plant stands in: shadow, soil mound, pebbles, grass tufts —
 * and, once a plant is wilting, cracks and fallen leaves.
 *
 * The soil is **not** recoloured by the health tint. It has its own dry variant,
 * because soil does not lose its colour the way foliage does; it dries out.
 */

const SOIL = { fresh: '#B08968', dry: '#B08B6C' } as const
const SOIL_OUTLINE = -0.5
const SOIL_OUTLINE_WIDTH = 1

const SHADOW = { cx: 50, cy: 108.6, rx: 27, ry: 5, fill: 'rgba(46, 58, 50, 0.12)' } as const

/*
 * Mound and highlight verbatim from the design prototype.
 *
 * The dome peaks at 89.5 while the plant is anchored at GROUND_Y (106). The
 * design bridges that gap by lifting the whole plant with PLANT_LIFT_Y in
 * Plant.tsx — do not "fix" it by flattening the mound here, the two belong
 * together.
 */
const MOUND_PATH = 'M22 108.6 C26 96 38 89.5 50 89.5 C62 89.5 74 96 78 108.6 Z'
const MOUND_HIGHLIGHT_PATH = 'M30 108.6 C33 99.5 40 94.6 50 94.6 C58 94.6 64 98 67.6 105 Z'
const MOUND_HIGHLIGHT = 'rgba(255, 255, 255, 0.16)'

const PEBBLE = { count: 5, fill: 'rgba(70, 50, 36, 0.28)' } as const
const CRACK = { count: 3, stroke: 'rgba(90, 66, 42, 0.35)', width: 0.7 } as const
const FALLEN_LEAF = { count: 5, dark: '#8A6634', light: '#9C7742', opacity: 0.8 } as const
const GRASS = { count: 3, front: '#7F9A6B', back: '#8FA97A' } as const

/** Grass appears once something is actually growing. */
const GRASS_FROM_STAGE = 1
/** Fallen leaves need a plant big enough to have shed them. */
const FALLEN_LEAF_FROM_STAGE = 2

interface GroundOptions {
  growthStage: GrowthStage
  /** Dry soil with cracks, and fallen leaves for larger plants. */
  dry: boolean
  /** Per-species seed, so the scatter is stable but not identical everywhere. */
  seed: number
  detail: boolean
  paint: PaintRegistry
}

export const drawGround = ({
  growthStage,
  dry,
  seed,
  detail,
  paint,
}: GroundOptions): ReactElement[] => {
  const soil = dry ? SOIL.dry : SOIL.fresh

  const elements: ReactElement[] = [
    <ellipse key="shadow" {...SHADOW} />,
    <path
      key="mound"
      d={MOUND_PATH}
      fill={paint.fill(soil)}
      stroke={mix(soil, SOIL_OUTLINE)}
      strokeWidth={SOIL_OUTLINE_WIDTH}
      strokeLinejoin="round"
    />,
    <path key="mound-highlight" d={MOUND_HIGHLIGHT_PATH} fill={MOUND_HIGHLIGHT} />,
  ]

  if (detail) {
    for (let index = 0; index < PEBBLE.count; index += 1) {
      elements.push(
        <circle
          key={`pebble-${index}`}
          cx={32 + pseudoRandom(seed + index * 5) * 36}
          cy={99 + pseudoRandom(seed + index * 7) * 8}
          r={0.8 + pseudoRandom(seed + index) * 0.7}
          fill={PEBBLE.fill}
        />,
      )
    }
  }

  if (dry) {
    for (let index = 0; index < CRACK.count; index += 1) {
      elements.push(
        <path
          key={`crack-${index}`}
          d={`M${34 + index * 13} ${102 + pseudoRandom(seed + index) * 3} l3 -2 l2.6 2.4`}
          stroke={CRACK.stroke}
          strokeWidth={CRACK.width}
          fill="none"
        />,
      )
    }
  }

  if (dry && growthStage >= FALLEN_LEAF_FROM_STAGE) {
    for (let index = 0; index < FALLEN_LEAF.count; index += 1) {
      const x = 30 + index * 10
      elements.push(
        <ellipse
          key={`fallen-${index}`}
          cx={x + pseudoRandom(seed + index) * 5}
          cy={99.5 + pseudoRandom(seed + index * 3) * 6}
          rx={2.8}
          ry={1.15}
          fill={paint.fill(index % 2 ? FALLEN_LEAF.light : FALLEN_LEAF.dark)}
          opacity={FALLEN_LEAF.opacity}
          transform={`rotate(${index * 41 - 30} ${x} 101)`}
        />,
      )
    }
  }

  if (!dry && growthStage >= GRASS_FROM_STAGE) {
    for (let index = 0; index < GRASS.count; index += 1) {
      const x = 32 + index * 17 + pseudoRandom(seed + index * 11) * 5
      elements.push(
        <path
          key={`grass-front-${index}`}
          d={`M${x} 104 Q${x + 1.6} 99 ${x + 3.4} 96.5`}
          stroke={GRASS.front}
          strokeWidth={1.1}
          fill="none"
          strokeLinecap="round"
          opacity={0.8}
        />,
        <path
          key={`grass-back-${index}`}
          d={`M${x} 104 Q${x - 1.4} 100 ${x - 2.6} 97.5`}
          stroke={GRASS.back}
          strokeWidth={1}
          fill="none"
          strokeLinecap="round"
          opacity={0.7}
        />,
      )
    }
  }

  return elements
}


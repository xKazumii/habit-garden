import type { ReactElement } from 'react'

import { mix } from '../../lib/color'
import { pseudoOffset } from '../../lib/pseudo-random'
import type { PaintRegistry } from './paint'

/**
 * The geometric primitives every plant is built from: leaf, stem, organic blob.
 *
 * These are drawing functions rather than components — see paint.tsx for why.
 * Each takes the paint registry so its fills become gradients.
 */

/** Outline darkness relative to the fill, shared by all primitives. */
const OUTLINE = -0.5
const STEM_OUTLINE = -0.45
const HIGHLIGHT = 0.3
const MIDRIB = -0.32

const LEAF_OUTLINE_RATIO = 0.19
const LEAF_OUTLINE_MIN = 0.5
const LEAF_HIGHLIGHT_OPACITY = 0.6
const LEAF_MIDRIB_RATIO = 0.11
const LEAF_MIDRIB_MIN = 0.35
const LEAF_MIDRIB_OPACITY = 0.55

const STEM_OUTLINE_WIDTH = 0.7

/** How far a blob's radius wobbles, as a share of the radius. */
const BLOB_WOBBLE = 0.34
const BLOB_POINTS = 9

/**
 * A leaf pointing along the positive x axis, tip at (length, 0).
 * Two mirrored cubic curves — fuller than an ellipse and it comes to a point.
 */
export const leafPath = (length: number, width: number): string =>
  `M0 0 C${length * 0.2} ${-width} ${length * 0.7} ${-width * 0.78} ${length} 0` +
  ` C${length * 0.7} ${width * 0.78} ${length * 0.2} ${width} 0 0 Z`

interface LeafOptions {
  key: string
  x: number
  y: number
  /** Degrees. 0 points right, 180 points left. */
  angle: number
  length: number
  width: number
  color: string
  /** Adds the lit upper half and the midrib. */
  detail: boolean
  paint: PaintRegistry
}

export const drawLeaf = ({
  key,
  x,
  y,
  angle,
  length,
  width,
  color,
  detail,
  paint,
}: LeafOptions): ReactElement => (
  <g key={key} transform={`translate(${x} ${y}) rotate(${angle})`}>
    <path
      d={leafPath(length, width)}
      fill={paint.fill(color)}
      stroke={mix(color, OUTLINE)}
      strokeWidth={Math.max(LEAF_OUTLINE_MIN, width * LEAF_OUTLINE_RATIO)}
      strokeLinejoin="round"
    />

    {detail && (
      <>
        <path
          d={
            `M0 0 C${length * 0.2} ${-width} ${length * 0.7} ${-width * 0.78} ${length} 0` +
            ` C${length * 0.62} ${-width * 0.26} ${length * 0.3} ${-width * 0.14} 0 0 Z`
          }
          fill={paint.fill(mix(color, HIGHLIGHT))}
          opacity={LEAF_HIGHLIGHT_OPACITY}
        />
        <path
          d={`M${length * 0.06} 0 Q${length * 0.5} ${-width * 0.1} ${length * 0.92} 0`}
          stroke={mix(color, MIDRIB)}
          strokeWidth={Math.max(LEAF_MIDRIB_MIN, width * LEAF_MIDRIB_RATIO)}
          fill="none"
          strokeLinecap="round"
          opacity={LEAF_MIDRIB_OPACITY}
        />
      </>
    )}
  </g>
)

interface StemOptions {
  key: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  /** Half width at the base and at the tip — stems taper. */
  fromWidth: number
  toWidth: number
  /** Sideways offset of the midpoint. Positive bends right. */
  bow: number
  color: string
  paint: PaintRegistry
}

export const drawStem = ({
  key,
  fromX,
  fromY,
  toX,
  toY,
  fromWidth,
  toWidth,
  bow,
  color,
  paint,
}: StemOptions): ReactElement => {
  const midX = (fromX + toX) / 2 + bow
  const midY = (fromY + toY) / 2

  const path =
    `M${fromX - fromWidth} ${fromY}` +
    ` Q${midX - fromWidth * 0.5} ${midY} ${toX - toWidth} ${toY}` +
    ` L${toX + toWidth} ${toY}` +
    ` Q${midX + fromWidth * 0.5} ${midY} ${fromX + fromWidth} ${fromY} Z`

  return (
    <path
      key={key}
      d={path}
      fill={paint.fill(color)}
      stroke={mix(color, STEM_OUTLINE)}
      strokeWidth={STEM_OUTLINE_WIDTH}
      strokeLinejoin="round"
    />
  )
}

/**
 * A closed, slightly irregular blob — the building block of tree crowns.
 *
 * Points are placed on an ellipse with a wobbling radius and joined through
 * their midpoints with quadratic curves, which keeps the outline smooth.
 * The wobble is deterministic: same seed, same blob.
 */
export const blobPath = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number,
  points: number = BLOB_POINTS,
): string => {
  const corners = Array.from({ length: points }, (_unused, index) => {
    const angle = (index / points) * Math.PI * 2
    const wobble = 1 + pseudoOffset(seed + index) * BLOB_WOBBLE
    return [cx + Math.cos(angle) * rx * wobble, cy + Math.sin(angle) * ry * wobble] as const
  })

  const midpoint = (a: number, b: number): readonly [number, number] => {
    const first = corners[a] ?? [cx, cy]
    const second = corners[b] ?? [cx, cy]
    return [(first[0] + second[0]) / 2, (first[1] + second[1]) / 2]
  }

  const start = midpoint(0, 1)
  let path = `M${start[0]} ${start[1]}`

  for (let index = 1; index <= points; index += 1) {
    const corner = corners[index % points] ?? [cx, cy]
    const next = midpoint(index % points, (index + 1) % points)
    path += ` Q${corner[0]} ${corner[1]} ${next[0]} ${next[1]}`
  }

  return `${path} Z`
}

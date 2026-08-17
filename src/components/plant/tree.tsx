import type { ReactElement } from 'react'

import { CENTER_X, GROUND_Y } from '../../config/plant-visuals'
import type { TreeVisual } from '../../config/species'
import { mix } from '../../lib/color'
import { pseudoOffset, pseudoRandom } from '../../lib/pseudo-random'
import { litOf, shadeOf, type BodyContext } from './body'
import { blobPath, drawLeaf, drawStem } from './shapes'

/**
 * Tree: a flared trunk with branches and a crown built from overlapping organic
 * blobs — a shadow pass, a colour pass, a highlight and a broken rim light.
 *
 * A conifer takes a different route entirely: four tiers of zigzag boughs
 * instead of a round crown.
 */

const TRUNK_HEIGHT = 50
const TRUNK_BASE_WIDTH = 2.4
const TRUNK_GROWTH_WIDTH = 2.8
/** The trunk starts a little below the ground line so the flare can sit on it. */
const TRUNK_FOOT_Y = 102
const FLARE_Y = 100

const SPROUT_STAGE = 1
const CROWN_STAGE = 2
const BLOSSOM_STAGE = 3
const FRUIT_STAGE = 4

/** Bark detail only pays off once the trunk is wide enough to show it. */
const BARK_MIN_GROWTH = 0.4
const BARK_DASHES = 4
const BARK_COLOR = '#6E6A60'

const CROWN_BASE_RADIUS = 11
const CROWN_GROWTH_RADIUS = 19
const SLIM_FACTOR = 0.84

/** The five blobs a crown is made of: offset x, offset y, size, seed step. */
const CROWN_MASSES: readonly { x: number; y: number; size: number; step: number }[] = [
  { x: 0, y: 0, size: 1, step: 0 },
  { x: -0.66, y: 0.3, size: 0.7, step: 11 },
  { x: 0.68, y: 0.26, size: 0.72, step: 23 },
  { x: -0.3, y: -0.42, size: 0.6, step: 37 },
  { x: 0.34, y: -0.46, size: 0.58, step: 51 },
]

const BRANCHES: readonly { x: number; y: number }[] = [
  { x: -1, y: 0.5 },
  { x: 1, y: 0.42 },
]

const RIM_LEAVES = 12
const BLOSSOM_DOTS = 9
const BLOSSOM_RADIUS = 2.4

const FRUIT_SPOTS: readonly { x: number; y: number }[] = [
  { x: -0.58, y: 0.5 },
  { x: 0.5, y: 0.2 },
  { x: 0.02, y: 0.72 },
  { x: 0.74, y: -0.24 },
  { x: -0.44, y: -0.3 },
]
const FRUIT_RADIUS = 3.3

const CONIFER = { baseHeight: 22, growthHeight: 36, baseWidth: 10, growthWidth: 16, tiers: 4 } as const
const CONIFER_CONES = 2

export const drawTree = (visual: TreeVisual, context: BodyContext): ReactElement[] => {
  const { growthStage, growth, droop, detail, seed, paint } = context

  const shade = shadeOf(visual.leaf)
  const lit = litOf(visual.leaf, visual.leafLight)

  const top = GROUND_Y - TRUNK_HEIGHT * growth
  const halfWidth = TRUNK_BASE_WIDTH + TRUNK_GROWTH_WIDTH * growth

  const elements: ReactElement[] = [
    <path
      key="flare"
      d={
        `M${CENTER_X - halfWidth - 2.6} ${GROUND_Y}` +
        ` Q${CENTER_X - halfWidth} 103 ${CENTER_X - halfWidth * 0.8} ${FLARE_Y}` +
        ` L${CENTER_X + halfWidth * 0.8} ${FLARE_Y}` +
        ` Q${CENTER_X + halfWidth} 103 ${CENTER_X + halfWidth + 2.6} ${GROUND_Y} Z`
      }
      fill={paint.fill(mix(visual.trunk, -0.12))}
    />,
    drawStem({
      key: 'trunk',
      fromX: CENTER_X,
      fromY: TRUNK_FOOT_Y,
      toX: CENTER_X + pseudoOffset(seed) * 4 * growth,
      toY: top,
      fromWidth: halfWidth,
      toWidth: halfWidth * 0.5,
      bow: 0,
      color: visual.trunk,
      paint,
    }),
  ]

  if (detail && growth > BARK_MIN_GROWTH) {
    if (visual.paleBark) {
      for (let dash = 0; dash < BARK_DASHES; dash += 1) {
        elements.push(
          <path
            key={`bark-${dash}`}
            d={`M${CENTER_X - halfWidth * 0.7} ${FLARE_Y - dash * 9 - 4} h${halfWidth * 1.2}`}
            stroke={BARK_COLOR}
            strokeWidth={1}
            opacity={0.55}
          />,
        )
      }
    } else {
      elements.push(
        <path
          key="bark"
          d={
            `M${CENTER_X - halfWidth * 0.25} ${FLARE_Y}` +
            ` Q${CENTER_X - halfWidth * 0.1} ${(FLARE_Y + top) / 2} ${CENTER_X - halfWidth * 0.15} ${top + 3}`
          }
          stroke={mix(visual.trunk, -0.22)}
          strokeWidth={Math.max(0.6, halfWidth * 0.28)}
          fill="none"
          opacity={0.6}
        />,
      )
    }
  }

  if (growthStage >= CROWN_STAGE && visual.conifer) {
    const height = CONIFER.baseHeight + CONIFER.growthHeight * growth
    const width = CONIFER.baseWidth + CONIFER.growthWidth * growth

    for (let tier = 0; tier < CONIFER.tiers; tier += 1) {
      const scale = 1 - tier * 0.2
      const bottom = top + 8 - tier * height * 0.22
      const tierHeight = height * 0.55 * scale
      const tierWidth = width * scale

      let path = `M${CENTER_X} ${bottom - tierHeight}`
      for (let step = 0; step < 4; step += 1) {
        const along = (step + 1) / 4
        const x = CENTER_X + tierWidth * along
        const y = bottom - tierHeight * (1 - along)
        path += ` L${x - tierWidth * 0.09} ${y - tierHeight * 0.06} L${x} ${y}`
      }
      path += ` L${CENTER_X - tierWidth} ${bottom}`
      for (let step = 3; step >= 0; step -= 1) {
        const along = (step + 1) / 4
        const x = CENTER_X - tierWidth * along
        const y = bottom - tierHeight * (1 - along)
        path += ` L${x} ${y} L${x + tierWidth * 0.09} ${y - tierHeight * 0.06}`
      }

      elements.push(
        <path
          key={`tier-${tier}`}
          d={`${path} Z`}
          fill={paint.fill(tier % 2 ? lit : visual.leaf)}
          stroke={mix(visual.leaf, -0.6)}
          strokeWidth={0.9}
          strokeLinejoin="round"
        />,
      )
    }

    if (growthStage === FRUIT_STAGE) {
      for (let cone = 0; cone < CONIFER_CONES; cone += 1) {
        elements.push(
          <ellipse
            key={`cone-${cone}`}
            cx={CENTER_X + (cone ? 1 : -1) * width * 0.45}
            cy={top - 4 - cone * 12}
            rx={2.3}
            ry={3.6}
            fill={paint.fill(visual.fruit)}
            transform={`rotate(${cone ? 14 : -14} ${CENTER_X} ${top - 4})`}
          />,
        )
      }
    }

    return elements
  }

  if (growthStage >= CROWN_STAGE) {
    const radius =
      (CROWN_BASE_RADIUS + CROWN_GROWTH_RADIUS * growth) * (visual.slim ? SLIM_FACTOR : 1)
    const crownY = top - radius * 0.42

    BRANCHES.forEach((branch, index) => {
      elements.push(
        drawStem({
          key: `branch-${index}`,
          fromX: CENTER_X,
          fromY: top + radius * 0.5,
          toX: CENTER_X + branch.x * radius * 0.62,
          toY: crownY + radius * branch.y * 0.4,
          fromWidth: halfWidth * 0.55,
          toWidth: halfWidth * 0.25,
          bow: 0,
          color: mix(visual.trunk, -0.06),
          paint,
        }),
      )
    })

    // Shadow pass: slightly larger and much darker, giving the crown depth.
    CROWN_MASSES.forEach((mass, index) => {
      elements.push(
        <path
          key={`crown-shadow-${index}`}
          d={blobPath(
            CENTER_X + mass.x * radius,
            crownY + mass.y * radius,
            radius * mass.size * 1.06,
            radius * mass.size * 0.96,
            seed + mass.step,
          )}
          fill={paint.fill(mix(visual.leaf, -0.62))}
        />,
      )
    })

    CROWN_MASSES.forEach((mass, index) => {
      elements.push(
        <path
          key={`crown-${index}`}
          d={blobPath(
            CENTER_X + mass.x * radius,
            crownY + mass.y * radius,
            radius * mass.size,
            radius * mass.size * 0.9,
            seed + mass.step,
          )}
          fill={paint.fill(index % 2 ? shade : visual.leaf)}
        />,
      )
    })

    elements.push(
      <path
        key="crown-highlight"
        d={blobPath(
          CENTER_X - radius * 0.34,
          crownY - radius * 0.3,
          radius * 0.6,
          radius * 0.5,
          seed + 71,
          8,
        )}
        fill={paint.fill(lit)}
        opacity={0.85}
      />,
      /* A broken rim light — the dash pattern keeps it from looking like an outline. */
      <path
        key="crown-rim"
        d={blobPath(
          CENTER_X - radius * 0.16,
          crownY - radius * 0.16,
          radius * 0.94,
          radius * 0.82,
          seed,
        )}
        fill="none"
        stroke={mix(visual.leaf, 0.62)}
        strokeWidth={Math.max(0.8, radius * 0.075)}
        strokeLinejoin="round"
        opacity={0.5}
        strokeDasharray={`${radius * 1.5} ${radius * 4.4}`}
        strokeDashoffset={radius * 0.6}
      />,
    )

    if (detail) {
      for (let index = 0; index < RIM_LEAVES; index += 1) {
        const angle = (index / RIM_LEAVES) * Math.PI * 2
        const reach = radius * (0.86 + 0.2 * pseudoRandom(seed + index * 3))
        elements.push(
          drawLeaf({
            key: `rim-leaf-${index}`,
            x: CENTER_X + Math.cos(angle) * reach,
            y: crownY + Math.sin(angle) * reach * 0.9,
            angle: (angle * 180) / Math.PI + pseudoOffset(seed + index) * 40,
            length: radius * 0.3,
            width: radius * 0.13,
            color: index % 3 ? lit : visual.leaf,
            detail: false,
            paint,
          }),
        )
      }
    }

    if (growthStage >= BLOSSOM_STAGE && visual.blossoms) {
      for (let index = 0; index < BLOSSOM_DOTS; index += 1) {
        const angle = (index / BLOSSOM_DOTS) * Math.PI * 2
        const reach = radius * (0.5 + 0.45 * pseudoRandom(seed + index * 13))
        elements.push(
          <circle
            key={`blossom-${index}`}
            cx={CENTER_X + Math.cos(angle) * reach}
            cy={crownY + Math.sin(angle) * reach * 0.9}
            r={BLOSSOM_RADIUS}
            fill={paint.fill(visual.leafLight)}
          />,
        )
      }
    }

    if (growthStage === FRUIT_STAGE) {
      FRUIT_SPOTS.forEach((spot, index) => {
        const x = CENTER_X + spot.x * radius
        const y = crownY + spot.y * radius
        elements.push(
          <circle
            key={`fruit-${index}`}
            cx={x}
            cy={y}
            r={FRUIT_RADIUS}
            fill={paint.fill(visual.fruit)}
          />,
        )
        if (detail) {
          elements.push(
            <circle
              key={`fruit-glint-${index}`}
              cx={x - 1}
              cy={y - 1.1}
              r={1.05}
              fill={mix(visual.fruit, 0.42)}
              opacity={0.85}
            />,
          )
        }
      })
    }

    return elements
  }

  if (growthStage === SPROUT_STAGE) {
    elements.push(
      drawLeaf({
        key: 'cotyledon-a',
        x: CENTER_X,
        y: top + 1,
        angle: 180 - (-16 + droop),
        length: 6,
        width: 2.6,
        color: lit,
        detail,
        paint,
      }),
      drawLeaf({
        key: 'cotyledon-b',
        x: CENTER_X,
        y: top + 1,
        angle: -16 + droop,
        length: 6,
        width: 2.6,
        color: visual.leaf,
        detail,
        paint,
      }),
    )
  }

  return elements
}

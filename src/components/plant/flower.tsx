import type { ReactElement } from 'react'

import { CENTER_X, GROUND_Y } from '../../config/plant-visuals'
import type { FlowerVisual, SeedShape } from '../../config/species'
import { mix } from '../../lib/color'
import { pseudoOffset, pseudoRandom } from '../../lib/pseudo-random'
import { litOf, shadeOf, type BodyContext } from './body'
import { drawLeaf, drawStem } from './shapes'

/**
 * Flower: a basal rosette, one to five stems, buds that open into layered
 * petals at stage 4.
 *
 * Two special cases. A bulb species pushes up bare shoots for its first two
 * stages — a tulip has no rosette. And a species with short petals is drawn as
 * a cluster: more stems, smaller heads, the way forget-me-nots grow.
 */

const FULL_HEIGHT = 68

/** Below this petal height the species becomes a cluster. */
const CLUSTER_PETAL_HEIGHT = 8

const SPROUT_STAGE = 1
const SHOOT_STAGE = 2
const FIRST_BLOOM_STAGE = 3
const FULL_BLOOM_STAGE = 4

/** Layered petals: dark backing, outer ring, offset inner ring, lit core. */
const PETAL_LAYERS = {
  backing: { scale: 1.1, height: 1.06, shade: -0.55, offset: 0 },
  outer: { scale: 1, height: 1, shade: -0.14, offset: 0 },
  inner: { scale: 0.92, height: 0.92, shade: 0, offset: 0.5 },
  highlight: { scale: 0.42, height: 0.66, shade: 0.28, offset: 0.5 },
} as const
const PETAL_ROTATION_OFFSET = 6

/** Centre radius grows with the number of petals. */
const CENTER_RADIUS = { many: 6.4, some: 4.4, few: 3.4 } as const
const MANY_PETALS = 9
const SOME_PETALS = 5
const CENTER_SPECKS = 6

const petalPath = (width: number, length: number): string =>
  `M0 0 C${-width} ${-length * 0.42} ${-width * 0.82} ${-length * 0.9} 0 ${-length}` +
  ` C${width * 0.82} ${-length * 0.9} ${width} ${-length * 0.42} 0 0 Z`

const stemCount = (growthStage: number, cluster: boolean): number => {
  if (cluster) {
    if (growthStage >= FULL_BLOOM_STAGE) return 5
    return growthStage >= FIRST_BLOOM_STAGE ? 4 : 3
  }
  return growthStage >= FULL_BLOOM_STAGE ? 3 : 2
}

export const drawFlower = (
  visual: FlowerVisual,
  seedShape: SeedShape,
  context: BodyContext,
): ReactElement[] => {
  const { growthStage, growth, droop, detail, seed, paint } = context

  const shade = shadeOf(visual.leaf)
  const lit = litOf(visual.leaf, visual.leafLight)
  const baseTop = GROUND_Y - FULL_HEIGHT * growth
  const cluster = visual.petalHeight < CLUSTER_PETAL_HEIGHT

  /* A bulb sends up bare shoots before it grows a rosette. */
  if (seedShape === 'bulb' && growthStage <= SHOOT_STAGE) {
    const shoots = growthStage === SPROUT_STAGE ? 2 : 3
    return Array.from({ length: shoots }, (_unused, index) => {
      const offset = (index - (shoots - 1) / 2) * 3.4
      const height = (GROUND_Y - baseTop) * (0.8 + 0.15 * (index % 2))
      const x = CENTER_X + offset
      return (
        <path
          key={`shoot-${index}`}
          d={
            `M${x - 1.8} ${GROUND_Y}` +
            ` Q${x + offset * 0.4} ${GROUND_Y - height * 0.6} ${x + offset * 0.9} ${GROUND_Y - height}` +
            ` Q${x + 0.6} ${GROUND_Y - height * 0.55} ${x + 1.8} ${GROUND_Y} Z`
          }
          fill={paint.fill(index % 2 ? lit : visual.leaf)}
          stroke={mix(visual.leaf, -0.45)}
          strokeWidth={0.6}
          strokeLinejoin="round"
        />
      )
    })
  }

  /* A seedling: two cotyledons on a short stem. */
  if (growthStage === SPROUT_STAGE) {
    return [
      drawLeaf({
        key: 'cotyledon-a',
        x: CENTER_X,
        y: baseTop + 1,
        angle: 196,
        length: 5.5,
        width: 2.4,
        color: lit,
        detail,
        paint,
      }),
      drawLeaf({
        key: 'cotyledon-b',
        x: CENTER_X,
        y: baseTop + 1,
        angle: -16,
        length: 5.5,
        width: 2.4,
        color: visual.leaf,
        detail,
        paint,
      }),
      drawStem({
        key: 'stem-0',
        fromX: CENTER_X,
        fromY: GROUND_Y,
        toX: CENTER_X,
        toY: baseTop,
        fromWidth: 1.7,
        toWidth: 1.2,
        bow: 0,
        color: shade,
        paint,
      }),
    ]
  }

  const elements: ReactElement[] = []

  // Basal rosette — the leaves lying flat on the soil.
  const rosette = growthStage >= FIRST_BLOOM_STAGE ? 3 : 2
  for (let index = 0; index < rosette; index += 1) {
    const side = index % 2 ? 1 : -1
    const spread = 1 + Math.floor(index / 2) * 0.35
    const length = (7 + 6 * growth) * spread
    const angle = 14 + index * 8 + droop * 0.6

    elements.push(
      drawLeaf({
        key: `rosette-${index}`,
        x: CENTER_X + side * 1.6,
        y: 104.4 - index * 1.1,
        angle: side > 0 ? angle : 180 - angle,
        length,
        width: length * 0.34,
        color: index % 2 ? lit : visual.leaf,
        detail,
        paint,
      }),
    )
  }

  const stems = stemCount(growthStage, cluster)

  for (let index = 0; index < stems; index += 1) {
    const isMain = index === 0
    const scale = isMain
      ? 1
      : cluster
        ? 0.72 + 0.18 * pseudoRandom(seed + index)
        : 0.74 + 0.12 * (index % 2)

    const dx = isMain
      ? 0
      : (index % 2 ? 1 : -1) * (cluster ? 4.5 + index * 2.2 : 8.5 + index * 1.6)

    const top = GROUND_Y - (GROUND_Y - baseTop) * scale
    const bow = pseudoOffset(seed + index * 7) * 8 * growth + dx * 0.35

    elements.push(
      drawStem({
        key: `stem-${index}`,
        fromX: CENTER_X,
        fromY: GROUND_Y,
        toX: CENTER_X + dx,
        toY: top,
        fromWidth: (isMain ? 1.9 : 1.4) + 0.7 * growth,
        toWidth: 1 + 0.35 * growth,
        bow,
        color: shade,
        paint,
      }),
    )

    const headX = CENTER_X + dx + bow * 0.35
    const headY = top

    const leaves = isMain ? (growthStage >= FIRST_BLOOM_STAGE ? 3 : 2) : 2
    for (let leaf = 0; leaf < leaves; leaf += 1) {
      const along = 0.34 + leaf * 0.24
      const side = (index + leaf) % 2 ? 1 : -1
      const length = (6.5 + 7 * growth) * scale * (1 - 0.14 * leaf)
      const angle = 16 + leaf * 6 + droop

      elements.push(
        drawLeaf({
          key: `leaf-${index}-${leaf}`,
          x: CENTER_X + dx * along + bow * along * 0.4,
          y: GROUND_Y - (GROUND_Y - top) * along,
          angle: side > 0 ? angle : 180 - angle,
          length,
          width: length * 0.33,
          color: (index + leaf) % 2 ? lit : visual.leaf,
          detail,
          paint,
        }),
      )
    }

    /* The main stem opens one stage before the side stems do. */
    const isOpen =
      growthStage === FULL_BLOOM_STAGE || (growthStage === FIRST_BLOOM_STAGE && isMain)

    if (!isOpen) {
      const height = (growthStage === FIRST_BLOOM_STAGE ? 9 : 6) * scale
      const budColor = growthStage === FIRST_BLOOM_STAGE ? visual.bloom : lit

      elements.push(
        <path
          key={`bud-${index}`}
          d={
            `M${headX} ${headY - height}` +
            ` C${headX + height * 0.45} ${headY - height * 0.6} ${headX + height * 0.38} ${headY} ${headX} ${headY + 1}` +
            ` C${headX - height * 0.38} ${headY} ${headX - height * 0.45} ${headY - height * 0.6} ${headX} ${headY - height} Z`
          }
          fill={paint.fill(budColor)}
          stroke={mix(budColor, -0.45)}
          strokeWidth={0.6}
        />,
        <path
          key={`sepal-${index}`}
          d={
            `M${headX} ${headY + 1}` +
            ` C${headX + height * 0.36} ${headY - 1} ${headX + height * 0.3} ${headY - height * 0.5} ${headX} ${headY - height * 0.5} Z`
          }
          fill={paint.fill(lit)}
        />,
      )
      continue
    }

    const petals = visual.petals
    const width = visual.petalWidth * scale
    const height = visual.petalHeight * scale
    const step = 360 / petals

    const layer = (
      name: keyof typeof PETAL_LAYERS,
      spec: (typeof PETAL_LAYERS)[keyof typeof PETAL_LAYERS],
    ) =>
      Array.from({ length: petals }, (_unused, petal) => (
        <path
          key={`petal-${name}-${index}-${petal}`}
          d={petalPath(width * spec.scale, height * spec.height)}
          fill={paint.fill(mix(visual.bloom, spec.shade))}
          transform={
            `translate(${headX} ${headY})` +
            ` rotate(${petal * step + (spec.offset ? step * spec.offset : PETAL_ROTATION_OFFSET)})`
          }
        />
      ))

    elements.push(
      ...layer('backing', PETAL_LAYERS.backing),
      ...layer('outer', PETAL_LAYERS.outer),
      ...layer('inner', PETAL_LAYERS.inner),
    )
    if (detail) elements.push(...layer('highlight', PETAL_LAYERS.highlight))

    const radius =
      (petals > MANY_PETALS
        ? CENTER_RADIUS.many
        : petals > SOME_PETALS
          ? CENTER_RADIUS.some
          : CENTER_RADIUS.few) * scale

    elements.push(
      <circle
        key={`center-${index}`}
        cx={headX}
        cy={headY}
        r={radius}
        fill={paint.fill(visual.center)}
        stroke={mix(visual.center, -0.5)}
        strokeWidth={0.7}
      />,
    )

    if (detail) {
      elements.push(
        <circle
          key={`center-lit-${index}`}
          cx={headX - radius * 0.25}
          cy={headY - radius * 0.25}
          r={radius * 0.55}
          fill={paint.fill(mix(visual.center, 0.24))}
          opacity={0.8}
        />,
      )
      for (let speck = 0; speck < CENTER_SPECKS; speck += 1) {
        const angle = (speck * (360 / CENTER_SPECKS) * Math.PI) / 180
        elements.push(
          <circle
            key={`speck-${index}-${speck}`}
            cx={headX + Math.cos(angle) * radius * 0.6}
            cy={headY + Math.sin(angle) * radius * 0.6}
            r={0.7}
            fill={mix(visual.center, -0.3)}
            opacity={0.7}
          />,
        )
      }
    }
  }

  return elements
}

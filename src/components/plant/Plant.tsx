import type { ReactElement } from 'react'

import {
  CENTER_X,
  DETAIL_MIN_SIZE,
  DROP_HINT_GLINT,
  DROP_HINT_OPACITY,
  DROP_HINT_PATH,
  GROUND_Y,
  GROWTH_FACTOR,
  PLANT_LIFT_Y,
  HEALTH_RENDER,
  PLANT_ASPECT,
  PLANT_SIZE,
  PLANT_VIEWBOX,
  POUR_DROP_PATH,
  SWAY_ORIGIN_Y,
} from '../../config/plant-visuals'
import { speciesById } from '../../config/species'
import { hashString } from '../../lib/pseudo-random'
import type { GrowthStage, HealthState } from '../../types'
import type { BodyContext } from './body'
import { drawFlower } from './flower'
import { drawGround } from './ground'
import { drawHerb } from './herb'
import { createPaintRegistry } from './paint'
import { drawSeed, seedScaleFor } from './seeds'
import { tintVisual } from './tint'
import { drawTree } from './tree'

/**
 * The plant as a picture.
 *
 * Stage and health are two independent axes. The stage drives the geometry, and
 * health recolours the palette (`tint`) plus bends the leaves down (`droop`) —
 * there is no CSS filter over the finished image any more, so the soil keeps its
 * own colour.
 *
 * Below `DETAIL_MIN_SIZE` the fine detail is skipped. The bed renders twenty
 * plants at once and at 44px nobody sees a leaf vein.
 *
 * Purely decorative — the name always comes from the surrounding element.
 */

const SEED_STAGE = 0
const HUSK_STAGE = 1
const SPARKLE_STAGE = 4

/**
 * Where the seed sits, and the pivot it is scaled around. Verbatim from the
 * design prototype — the seed lies on the mound and is not lifted, only the
 * grown plant is.
 */
const SEED_CY = 88.5
const SEED_PIVOT_Y = 90
/** The spent husk lying next to a young tree or bulb. */
const HUSK_CY = 101.5

const SPARKLES: readonly { x: number; y: number; size: number }[] = [
  { x: 22, y: 34, size: 2.6 },
  { x: 78, y: 26, size: 2 },
  { x: 64, y: 14, size: 1.6 },
]
const SPARKLE_COLOR = '#F0DFA6'
const SPARKLE_OPACITY = 0.85

const SHADOW_DETAIL = 'drop-shadow(0 2.5px 1.6px rgba(40, 52, 42, 0.24))'
const SHADOW_PLAIN = 'drop-shadow(0 1.6px 1px rgba(40, 52, 42, 0.2))'

/** A four-pointed star, drawn from its centre outwards. */
const sparklePath = (x: number, y: number, size: number): string =>
  `M${x} ${y - size} L${x + size * 0.32} ${y} L${x + size} ${y}` +
  ` L${x + size * 0.32} ${y + size * 0.32} L${x} ${y + size}` +
  ` L${x - size * 0.32} ${y + size * 0.32} L${x - size} ${y}` +
  ` L${x - size * 0.32} ${y} Z`

interface PlantProps {
  species: string
  growthStage: GrowthStage
  healthState: HealthState
  /** Width in pixels. Height follows from the canvas aspect ratio. */
  size?: number
  /** Droplet hint above thirsty plants. Off in small renderings. */
  showDropHint?: boolean
  /** One-off bounce, e.g. right after a growth stage was reached. */
  celebrate?: boolean
  /** A droplet falls onto the plant — shown right after watering. */
  pouring?: boolean
  className?: string
}

export const Plant = ({
  species,
  growthStage,
  healthState,
  size = PLANT_SIZE.bed,
  showDropHint = true,
  celebrate = false,
  pouring = false,
  className,
}: PlantProps) => {
  const definition = speciesById(species)
  const render = HEALTH_RENDER[healthState]

  const detail = size >= DETAIL_MIN_SIZE
  const seed = hashString(species)

  /*
   * The gradients have to be registered before <defs> is rendered, which is why
   * the bodies are drawing functions called right here rather than child
   * components. See paint.tsx.
   */
  const paint = createPaintRegistry(`hg-${seed}-${growthStage}-${healthState}`, detail)

  const ground = drawGround({
    growthStage,
    dry: render.drySoil,
    seed,
    detail,
    paint,
  })

  const body = (): ReactElement[] => {
    if (!definition) return []

    if (growthStage === SEED_STAGE) {
      const scale = seedScaleFor(definition.seed)
      return [
        <g
          key="seed"
          transform={`translate(${CENTER_X} ${SEED_PIVOT_Y}) scale(${scale}) translate(${-CENTER_X} ${-SEED_PIVOT_Y})`}
        >
          {drawSeed(definition.seed, SEED_CY, paint)}
        </g>,
      ]
    }

    const context: BodyContext = {
      growthStage,
      growth: GROWTH_FACTOR[growthStage],
      droop: render.droop,
      detail,
      seed,
      paint,
    }

    switch (definition.category) {
      case 'herb':
        return drawHerb(tintVisual(definition.visual, render.tint), context)
      case 'flower':
        return drawFlower(tintVisual(definition.visual, render.tint), definition.seed, context)
      case 'tree':
        return drawTree(tintVisual(definition.visual, render.tint), context)
    }
  }

  /* Lift out of the mound, tilt around the base point, then squash. */
  const transforms = [`translate(0 ${-PLANT_LIFT_Y})`, `rotate(${render.rotation} ${CENTER_X} ${GROUND_Y})`]
  if (render.squash !== 1) {
    transforms.push(
      `translate(${CENTER_X} ${GROUND_Y}) scale(${render.spread} ${render.squash}) translate(${-CENTER_X} ${-GROUND_Y})`,
    )
  }

  const plant =
    growthStage === SEED_STAGE ? (
      body()
    ) : (
      <g
        className={render.sways ? 'animate-sway' : undefined}
        style={{ transformBox: 'view-box', transformOrigin: `${CENTER_X}px ${SWAY_ORIGIN_Y}px` }}
      >
        <g transform={transforms.join(' ')}>{body()}</g>
      </g>
    )

  /* The empty husk stays behind next to a young tree or bulb. */
  const husk =
    definition &&
    growthStage === HUSK_STAGE &&
    (definition.category === 'tree' || definition.seed === 'bulb') ? (
      <g
        transform="translate(-9 0) scale(0.8)"
        style={{ transformBox: 'view-box', transformOrigin: `${CENTER_X}px 101px` }}
        opacity={0.9}
      >
        {drawSeed(definition.seed, HUSK_CY, paint)}
      </g>
    ) : null

  const sparkles =
    detail && growthStage === SPARKLE_STAGE && healthState === 'healthy'
      ? SPARKLES.map((sparkle) => (
          <path
            key={`sparkle-${sparkle.x}`}
            d={sparklePath(sparkle.x, sparkle.y, sparkle.size)}
            fill={SPARKLE_COLOR}
            opacity={SPARKLE_OPACITY}
          />
        ))
      : null

  return (
    <svg
      viewBox={PLANT_VIEWBOX}
      width={size}
      height={size * PLANT_ASPECT}
      aria-hidden="true"
      focusable="false"
      className={celebrate ? `animate-grow ${className ?? ''}`.trim() : className}
      style={{
        filter: detail ? SHADOW_DETAIL : SHADOW_PLAIN,
        opacity: render.opacity,
        overflow: 'visible',
      }}
    >
      {detail && <defs>{paint.defs()}</defs>}
      {ground}
      {plant}
      {husk}
      {sparkles}

      {/* The thirst hint steps aside while water is actually falling. */}
      {render.showsDropHint && showDropHint && !pouring && (
        <>
          <path d={DROP_HINT_PATH} fill="var(--hg-thirsty)" opacity={DROP_HINT_OPACITY} />
          <ellipse {...DROP_HINT_GLINT} fill="rgba(255, 255, 255, 0.55)" />
        </>
      )}

      {pouring && (
        <path
          d={POUR_DROP_PATH}
          fill="var(--hg-thirsty)"
          className="animate-drop"
          style={{ transformBox: 'view-box' }}
        />
      )}
    </svg>
  )
}

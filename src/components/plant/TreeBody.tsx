import { CENTER_X, GROUND_Y, GROWTH_FACTOR } from '../../config/plant-visuals'
import type { TreeVisual } from '../../config/species'
import type { GrowthStage } from '../../types'
import { Leaf } from './Leaf'

/**
 * Baum: Stamm als leicht geschwungenes Trapez. Auf Stufe 1 sitzen nur zwei
 * Keimblätter obendrauf, ab Stufe 2 bilden drei überlappende Kreise die Krone,
 * auf Stufe 4 hängen Früchte darin.
 */

const TRUNK_HEIGHT = 46
/** Halbe Stammbreite unten und oben — beides wächst mit. */
const TRUNK_FOOT_BASE = 2
const TRUNK_FOOT_GROWTH = 2.6
const TRUNK_TOP_BASE = 1
const TRUNK_TOP_GROWTH = 1.2
/** Einzug der Stammflanke: wie weit die Kurve nach innen zieht und wo. */
const TRUNK_WAIST = 1
const TRUNK_WAIST_LIFT = 6

/** Ab dieser Stufe gibt es eine Krone statt zweier Keimblätter. */
const CROWN_STAGE = 2
const CROWN_BASE_RADIUS = 8
const CROWN_GROWTH_RADIUS = 18
/** Die Krone sitzt um den halben Radius über dem Stammende. */
const CROWN_LIFT_RATIO = 0.5
/** Die beiden Nebenkreise: Versatz und Größe, relativ zum Kronenradius. */
const SIDE_CROWNS: readonly { x: number; y: number; radius: number }[] = [
  { x: -0.62, y: 0.34, radius: 0.74 },
  { x: 0.62, y: 0.3, radius: 0.7 },
]

const SPROUT_STAGE = 1
const SPROUT_LEAF_SIZE = 5
const SPROUT_LEAF_LIFT = 2

const FRUITING_STAGE = 4
const FRUIT_RADIUS = 3.1
/** Fruchtpositionen relativ zum Kronenradius. */
const FRUIT_SPOTS: readonly { x: number; y: number }[] = [
  { x: -0.6, y: 0.5 },
  { x: 0.5, y: 0.2 },
  { x: 0, y: 0.72 },
  { x: 0.75, y: -0.3 },
]

interface TreeBodyProps {
  visual: TreeVisual
  growthStage: GrowthStage
}

export const TreeBody = ({ visual, growthStage }: TreeBodyProps) => {
  const growth = GROWTH_FACTOR[growthStage]
  const top = GROUND_Y - TRUNK_HEIGHT * growth

  const foot = TRUNK_FOOT_BASE + TRUNK_FOOT_GROWTH * growth
  const crest = TRUNK_TOP_BASE + TRUNK_TOP_GROWTH * growth
  const waistY = top + TRUNK_WAIST_LIFT

  const trunk =
    `M${CENTER_X - foot} ${GROUND_Y}` +
    ` Q${CENTER_X - TRUNK_WAIST} ${waistY} ${CENTER_X - crest} ${top}` +
    ` L${CENTER_X + crest} ${top}` +
    ` Q${CENTER_X + TRUNK_WAIST} ${waistY} ${CENTER_X + foot} ${GROUND_Y} Z`

  const hasCrown = growthStage >= CROWN_STAGE
  const crownRadius = CROWN_BASE_RADIUS + CROWN_GROWTH_RADIUS * growth
  const crownY = top - crownRadius * CROWN_LIFT_RATIO

  return (
    <>
      <path d={trunk} fill={visual.trunk} />

      {hasCrown && (
        <>
          {SIDE_CROWNS.map((crown) => (
            <circle
              key={crown.x}
              cx={CENTER_X + crownRadius * crown.x}
              cy={crownY + crownRadius * crown.y}
              r={crownRadius * crown.radius}
              fill={visual.leafLight}
            />
          ))}
          <circle cx={CENTER_X} cy={crownY} r={crownRadius} fill={visual.leaf} />

          {growthStage === FRUITING_STAGE &&
            FRUIT_SPOTS.map((spot) => (
              <circle
                key={`${spot.x}:${spot.y}`}
                cx={CENTER_X + crownRadius * spot.x}
                cy={crownY + crownRadius * spot.y}
                r={FRUIT_RADIUS}
                fill={visual.fruit}
              />
            ))}
        </>
      )}

      {growthStage === SPROUT_STAGE && (
        <>
          <Leaf
            x={CENTER_X}
            y={top + SPROUT_LEAF_LIFT}
            direction={-1}
            size={SPROUT_LEAF_SIZE}
            color={visual.leafLight}
          />
          <Leaf
            x={CENTER_X}
            y={top + SPROUT_LEAF_LIFT}
            direction={1}
            size={SPROUT_LEAF_SIZE}
            color={visual.leaf}
          />
        </>
      )}
    </>
  )
}

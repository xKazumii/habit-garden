import { CENTER_X, GROUND_Y, GROWTH_FACTOR } from '../../config/plant-visuals'
import type { HerbVisual } from '../../config/species'
import type { GrowthStage } from '../../types'
import { Leaf } from './Leaf'

/**
 * Kraut: zwei Stängel, ab Stufe 3 drei. Je Stängel Blattpaare an festen
 * relativen Höhen, auf Stufe 4 obendrauf eine kleine Blüte.
 */

/** Höhe des mittleren Stängels bei vollem Wachstum. */
const STEM_HEIGHT = 56
const STEM_WIDTH = 2.4
/** Wie stark der Stängel zur Seite bogt, relativ zu seiner Auslenkung. */
const STEM_BOW = 0.4

/** Ab dieser Stufe wächst ein dritter Stängel in der Mitte. */
const THIRD_STEM_STAGE = 3
const STEMS_YOUNG: readonly number[] = [-7, 7]
const STEMS_GROWN: readonly number[] = [-13, 0, 13]
/** Seitliche Stängel bleiben etwas niedriger als der mittlere. */
const SIDE_STEM_DROP = 7

/** Relative Höhen der Blattpaare am Stängel — 1 ist die Spitze. */
const LEAF_SPOTS_YOUNG: readonly number[] = [0.62, 1]
const LEAF_SPOTS_GROWN: readonly number[] = [0.42, 0.7, 0.94]
const LEAF_BASE_SIZE = 4.5
const LEAF_GROWTH_SIZE = 5
/** Blätter weiter oben am Stängel werden etwas größer. */
const LEAF_TAPER_BASE = 0.7
const LEAF_TAPER_SPAN = 0.3

const BLOOMING_STAGE = 4
const BLOOM_RADIUS = 3.4
const BLOOM_LIFT = 3

interface HerbBodyProps {
  visual: HerbVisual
  growthStage: GrowthStage
}

export const HerbBody = ({ visual, growthStage }: HerbBodyProps) => {
  const growth = GROWTH_FACTOR[growthStage]
  const top = GROUND_Y - STEM_HEIGHT * growth

  const isGrown = growthStage >= THIRD_STEM_STAGE
  const stems = isGrown ? STEMS_GROWN : STEMS_YOUNG
  const spots = isGrown ? LEAF_SPOTS_GROWN : LEAF_SPOTS_YOUNG
  const isBlooming = growthStage === BLOOMING_STAGE

  return (
    <>
      {stems.map((offset) => {
        const stemTop = top + (offset === 0 ? 0 : SIDE_STEM_DROP)
        const stemX = CENTER_X + offset

        return (
          <g key={offset}>
            <path
              d={`M${CENTER_X} ${GROUND_Y} Q${CENTER_X + offset * STEM_BOW} ${(GROUND_Y + stemTop) / 2} ${stemX} ${stemTop}`}
              stroke={visual.leaf}
              strokeWidth={STEM_WIDTH}
              strokeLinecap="round"
              fill="none"
            />

            {spots.map((fraction) => {
              const x = CENTER_X + offset * fraction
              const y = GROUND_Y - (GROUND_Y - stemTop) * fraction
              const size =
                (LEAF_BASE_SIZE + LEAF_GROWTH_SIZE * growth) *
                (LEAF_TAPER_BASE + LEAF_TAPER_SPAN * fraction)

              return (
                <g key={fraction}>
                  <Leaf x={x} y={y} direction={-1} size={size} color={visual.leafLight} />
                  <Leaf x={x} y={y} direction={1} size={size} color={visual.leaf} />
                </g>
              )
            })}

            {isBlooming && (
              <circle
                cx={stemX}
                cy={stemTop - BLOOM_LIFT}
                r={BLOOM_RADIUS}
                fill={visual.bloom}
              />
            )}
          </g>
        )
      })}
    </>
  )
}

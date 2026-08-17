import { CENTER_X, GROUND_Y, GROWTH_FACTOR } from '../../config/plant-visuals'
import type { FlowerVisual } from '../../config/species'
import type { GrowthStage } from '../../types'
import { Leaf } from './Leaf'

/**
 * Blume: ein Stängel, zwei Blätter, darüber eine Knospe. Die Knospe wächst über
 * die Stufen und öffnet sich auf Stufe 4 zu `petals` Blütenblättern um einen
 * Mittelpunkt.
 */

const STEM_HEIGHT = 66
const STEM_WIDTH = 2.6
/** Seitliche Auslenkung der Stängelmitte bei vollem Wachstum. */
const STEM_BOW = 5

/** Die Blätter sitzen auf halber Stängelhöhe. */
const LEAF_HEIGHT_FRACTION = 0.5
const LEAF_BASE_SIZE = 5
const LEAF_GROWTH_SIZE = 5.5
/** Das rechte Blatt sitzt tiefer und ist etwas kleiner. */
const LOWER_LEAF_DROP = 8
const LOWER_LEAF_SCALE = 0.9

/** Knospenform je Stufe. Stufe 4 ist die geöffnete Blüte, siehe unten. */
const BUD_BY_STAGE: Readonly<Record<number, { rx: number; ry: number; lift: number }>> = {
  1: { rx: 2.8, ry: 2.8, lift: 2 },
  2: { rx: 3.6, ry: 5, lift: 4 },
  3: { rx: 4.6, ry: 7.5, lift: 6 },
}
/** Auf Stufe 3 schimmert die Blütenfarbe schon durch. */
const OPENING_STAGE = 3
const OPENING_OPACITY = 0.55

const BLOOMING_STAGE = 4
const FULL_CIRCLE = 360
/** Blütenblätter sitzen leicht außerhalb des Mittelpunkts. */
const PETAL_LIFT_RATIO = 0.72
/** Jedes zweite Blatt etwas blasser — gibt der Blüte Tiefe. */
const ALTERNATE_PETAL_OPACITY = 0.92
/** Ab so vielen Blättern braucht die Blüte eine große Mitte. */
const MANY_PETALS = 6
const CENTER_RADIUS_LARGE = 7
const CENTER_RADIUS_SMALL = 4.6

interface FlowerBodyProps {
  visual: FlowerVisual
  growthStage: GrowthStage
}

export const FlowerBody = ({ visual, growthStage }: FlowerBodyProps) => {
  const growth = GROWTH_FACTOR[growthStage]
  const top = GROUND_Y - STEM_HEIGHT * growth

  const leafY = GROUND_Y - (GROUND_Y - top) * LEAF_HEIGHT_FRACTION
  const leafSize = LEAF_BASE_SIZE + LEAF_GROWTH_SIZE * growth

  const bud = BUD_BY_STAGE[growthStage]
  const isBlooming = growthStage === BLOOMING_STAGE
  const centerRadius = visual.petals > MANY_PETALS ? CENTER_RADIUS_LARGE : CENTER_RADIUS_SMALL

  return (
    <>
      <path
        d={`M${CENTER_X} ${GROUND_Y} Q${CENTER_X + STEM_BOW * growth} ${(GROUND_Y + top) / 2} ${CENTER_X} ${top}`}
        stroke={visual.leaf}
        strokeWidth={STEM_WIDTH}
        strokeLinecap="round"
        fill="none"
      />

      <Leaf x={CENTER_X} y={leafY} direction={-1} size={leafSize} color={visual.leafLight} />
      <Leaf
        x={CENTER_X}
        y={leafY + LOWER_LEAF_DROP * growth}
        direction={1}
        size={leafSize * LOWER_LEAF_SCALE}
        color={visual.leaf}
      />

      {bud && (
        <ellipse
          cx={CENTER_X}
          cy={top - bud.lift}
          rx={bud.rx}
          ry={bud.ry}
          fill={growthStage === OPENING_STAGE ? visual.bloom : visual.leafLight}
          opacity={growthStage === OPENING_STAGE ? OPENING_OPACITY : undefined}
        />
      )}

      {isBlooming && (
        <>
          {Array.from({ length: visual.petals }, (_unused, index) => (
            <ellipse
              key={index}
              cx={CENTER_X}
              cy={top - visual.petalHeight * PETAL_LIFT_RATIO}
              rx={visual.petalWidth}
              ry={visual.petalHeight}
              fill={visual.bloom}
              opacity={index % 2 === 0 ? 1 : ALTERNATE_PETAL_OPACITY}
              transform={`rotate(${(index * FULL_CIRCLE) / visual.petals} ${CENTER_X} ${top})`}
            />
          ))}
          <circle cx={CENTER_X} cy={top} r={centerRadius} fill={visual.center} />
        </>
      )}
    </>
  )
}

import {
  CENTER_X,
  DROP_HINT_OPACITY,
  DROP_HINT_PATH,
  GROUND_Y,
  HEALTH_RENDER,
  PLANT_ASPECT,
  PLANT_SIZE,
  PLANT_VIEWBOX,
} from '../../config/plant-visuals'
import { speciesById } from '../../config/species'
import type { GrowthStage, HealthState } from '../../types'
import { FlowerBody } from './FlowerBody'
import { HerbBody } from './HerbBody'
import { Seed, Soil } from './Soil'
import { TreeBody } from './TreeBody'

/**
 * Die Pflanze als Bild.
 *
 * Stufe und Gesundheit sind zwei unabhängige Achsen: die Stufe bestimmt die
 * Geometrie (das übernehmen die drei Body-Komponenten), die Gesundheit legt
 * sich als Neigung, Filter und Deckkraft darüber. Deshalb gibt es keine
 * gemalten Varianten, sondern nur diese eine Komponente.
 *
 * Rein dekorativ — den Namen liefert immer das umgebende Element.
 */

const SEED_STAGE = 0

interface PlantProps {
  species: string
  growthStage: GrowthStage
  healthState: HealthState
  /** Breite in Pixeln. Die Höhe folgt aus dem Seitenverhältnis der Leinwand. */
  size?: number
  /** Wassertropfen über durstigen Pflanzen. In kleinen Darstellungen aus. */
  showDropHint?: boolean
  /** Einmaliger Hüpfer, etwa direkt nach einem Stufenaufstieg. */
  celebrate?: boolean
  className?: string
}

export const Plant = ({
  species,
  growthStage,
  healthState,
  size = PLANT_SIZE.bed,
  showDropHint = true,
  celebrate = false,
  className,
}: PlantProps) => {
  const definition = speciesById(species)
  const render = HEALTH_RENDER[healthState]

  /*
   * Erst neigen, dann absacken, dann stauchen. Die Stauchung muss um den
   * Fußpunkt herum passieren, sonst rutscht die Pflanze aus der Erde.
   */
  const transforms = [`rotate(${render.rotation} ${CENTER_X} ${GROUND_Y})`]
  if (render.sink !== 0) transforms.push(`translate(0 ${render.sink})`)
  if (render.slump !== 1) {
    transforms.push(
      `translate(${CENTER_X} ${GROUND_Y}) scale(1 ${render.slump}) translate(${-CENTER_X} ${-GROUND_Y})`,
    )
  }

  const body = () => {
    if (!definition) return null
    switch (definition.category) {
      case 'herb':
        return <HerbBody visual={definition.visual} growthStage={growthStage} />
      case 'flower':
        return <FlowerBody visual={definition.visual} growthStage={growthStage} />
      case 'tree':
        return <TreeBody visual={definition.visual} growthStage={growthStage} />
    }
  }

  return (
    <svg
      viewBox={PLANT_VIEWBOX}
      width={size}
      height={size * PLANT_ASPECT}
      aria-hidden="true"
      focusable="false"
      className={celebrate ? `animate-grow ${className ?? ''}`.trim() : className}
      style={{ filter: render.filter, opacity: render.opacity, overflow: 'visible' }}
    >
      <Soil dry={render.drySoil} />

      {growthStage === SEED_STAGE ? (
        <Seed />
      ) : (
        <g
          className={render.sways ? 'animate-sway' : undefined}
          style={{ transformBox: 'view-box', transformOrigin: `${CENTER_X}px ${GROUND_Y}px` }}
        >
          <g transform={transforms.join(' ')}>{body()}</g>
        </g>
      )}

      {render.showsDropHint && showDropHint && (
        <path d={DROP_HINT_PATH} fill="var(--hg-thirsty)" opacity={DROP_HINT_OPACITY} />
      )}
    </svg>
  )
}

import {
  PLANT_SHADOW,
  SEED,
  SEED_SHEEN_PATH,
  SEED_SHEEN_WIDTH,
  SOIL_HIGHLIGHT_PATH,
  SOIL_MOUND_PATH,
} from '../../config/plant-visuals'

/**
 * Die Bodenschicht unter jeder Pflanze: Schatten, Erdhügel, Aufhellung.
 * Bei welken und eingegangenen Pflanzen wird die Erde trockener.
 */

interface SoilProps {
  dry: boolean
}

export const Soil = ({ dry }: SoilProps) => (
  <>
    <ellipse {...PLANT_SHADOW} fill="var(--hg-plant-shadow)" />
    <path d={SOIL_MOUND_PATH} fill={dry ? 'var(--hg-soil-dry)' : 'var(--hg-soil)'} />
    <path d={SOIL_HIGHLIGHT_PATH} fill="var(--hg-soil-highlight)" />
  </>
)

/** Stufe 0: ein Samen in der Erde. Für jede Art dasselbe Bild. */
export const Seed = () => (
  <>
    <ellipse {...SEED} fill="var(--hg-seed)" />
    <path
      d={SEED_SHEEN_PATH}
      stroke="var(--hg-seed-sheen)"
      strokeWidth={SEED_SHEEN_WIDTH}
      fill="none"
    />
  </>
)

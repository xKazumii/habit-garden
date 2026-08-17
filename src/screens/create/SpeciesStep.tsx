import { Plant } from '../../components/plant/Plant'
import { PLANT_SIZE } from '../../config/plant-visuals'
import { speciesByCategory } from '../../config/species'
import { speciesName } from '../../i18n/labels'
import type { PlantCategory } from '../../types'

/**
 * Step 2: the species within the category. Shown in full bloom — that is the
 * promise, not the starting state.
 */

const PREVIEW_STAGE = 4

interface SpeciesStepProps {
  category: PlantCategory
  selected: string | null
  /** Unlocked species only — the rest waits in the seed shop. */
  unlocked: ReadonlySet<string>
  onSelect: (speciesId: string) => void
}

export const SpeciesStep = ({ category, selected, unlocked, onSelect }: SpeciesStepProps) => (
  <div className="grid grid-cols-3 gap-2.5">
    {speciesByCategory(category)
      .filter((species) => unlocked.has(species.id))
      .map((species) => {
        const isSelected = species.id === selected

        return (
          <button
            key={species.id}
            type="button"
            onClick={() => onSelect(species.id)}
            aria-pressed={isSelected}
            className={`bg-surface shadow-card flex flex-col items-center gap-2 rounded-md border-[1.5px] px-1.5 py-3 transition-colors ${
              isSelected ? 'border-primary' : 'border-transparent'
            }`}
          >
            <span className="flex h-[78px] items-end justify-center">
              <Plant
                species={species.id}
                growthStage={PREVIEW_STAGE}
                healthState="healthy"
                size={PLANT_SIZE.tile}
                showDropHint={false}
              />
            </span>
            <span className="text-xs font-medium">{speciesName(species.id)}</span>
          </button>
        )
      })}
  </div>
)

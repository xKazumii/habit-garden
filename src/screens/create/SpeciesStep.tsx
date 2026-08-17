import { Plant } from '../../components/plant/Plant'
import { PLANT_SIZE } from '../../config/plant-visuals'
import { speciesByCategory } from '../../config/species'
import { speciesName } from '../../i18n/labels'
import type { PlantCategory } from '../../types'

/**
 * Schritt 2: die Sorte innerhalb der Kategorie. Gezeigt wird sie in voller
 * Blüte — das ist das Versprechen, nicht der Anfangszustand.
 */

const PREVIEW_STAGE = 4

interface SpeciesStepProps {
  category: PlantCategory
  selected: string | null
  onSelect: (speciesId: string) => void
}

export const SpeciesStep = ({ category, selected, onSelect }: SpeciesStepProps) => (
  <div className="grid grid-cols-3 gap-2.5">
    {speciesByCategory(category).map((species) => {
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

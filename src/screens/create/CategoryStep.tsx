import { Plant } from '../../components/plant/Plant'
import { PLANT_SIZE } from '../../config/plant-visuals'
import { CATEGORY_ORDER, defaultSpeciesFor } from '../../config/species'
import { categoryHint, categoryName } from '../../i18n/labels'
import type { PlantCategory } from '../../types'

/**
 * Step 1: the category. It decides how many waterings one growth stage costs —
 * which is why the pace is part of the description.
 */

/** Grown but not yet blooming: shows the character without showing off. */
const PREVIEW_STAGE = 3

interface CategoryStepProps {
  selected: PlantCategory | null
  onSelect: (category: PlantCategory) => void
}

export const CategoryStep = ({ selected, onSelect }: CategoryStepProps) => (
  <div className="flex flex-col gap-3">
    {CATEGORY_ORDER.map((category) => {
      const preview = defaultSpeciesFor(category)
      const isSelected = category === selected

      return (
        <button
          key={category}
          type="button"
          onClick={() => onSelect(category)}
          aria-pressed={isSelected}
          className={`bg-surface shadow-raised flex items-center gap-4 rounded-xl border-[1.5px] px-4.5 py-4 text-left transition-colors ${
            isSelected ? 'border-primary' : 'border-transparent'
          }`}
        >
          <span className="flex h-[74px] w-[66px] flex-none items-end justify-center">
            {preview && (
              <Plant
                species={preview.id}
                growthStage={PREVIEW_STAGE}
                healthState="healthy"
                size={PLANT_SIZE.category}
                showDropHint={false}
              />
            )}
          </span>

          <span className="flex flex-col gap-1">
            <span className="text-base leading-tight font-semibold">{categoryName(category)}</span>
            <span className="text-muted text-[12.5px] leading-snug">{categoryHint(category)}</span>
          </span>
        </button>
      )
    })}
  </div>
)

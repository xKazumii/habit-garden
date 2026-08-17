import { Plant } from '../../components/plant/Plant'
import { PLANT_SIZE } from '../../config/plant-visuals'
import { t } from '../../i18n'
import { rhythmLabel, speciesName } from '../../i18n/labels'
import type { DerivedPlant } from '../../types'

/**
 * One tile in the bed. Plants that are due get a ring pulsing calmly — the only
 * hint the garden gives of its own accord.
 */

interface GardenCellProps {
  plant: DerivedPlant
  onOpen: () => void
}

export const GardenCell = ({ plant, onOpen }: GardenCellProps) => {
  const { state } = plant

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('garden.openPlant', { habit: plant.habitName })}
      className={`bg-surface shadow-card flex w-full flex-col items-center gap-2 rounded-lg border-[1.5px] px-3 pt-3 pb-[13px] transition-transform duration-200 active:scale-[0.98] ${
        state.isDue ? 'border-primary animate-pulse-ring' : 'animate-enter border-transparent'
      }`}
    >
      <span className="flex h-24 items-end justify-center">
        <Plant
          species={plant.species}
          growthStage={state.growthStage}
          healthState={state.healthState}
          size={PLANT_SIZE.bed}
        />
      </span>

      <span className="flex w-full flex-col gap-0.5 text-left">
        <span className="truncate text-[13px] leading-tight font-medium">{plant.habitName}</span>
        <span className="text-muted text-[11px]">
          {t('garden.meta', {
            species: speciesName(plant.species),
            rhythm: rhythmLabel(plant.intervalDays),
          })}
        </span>
      </span>
    </button>
  )
}

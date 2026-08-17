import { WaterDropIcon } from '../../components/icons'
import { Plant } from '../../components/plant/Plant'
import { PLANT_SIZE } from '../../config/plant-visuals'
import { useDroplet } from '../../hooks/useDroplet'
import { t } from '../../i18n'
import { rhythmLabel, stageLabel } from '../../i18n/labels'
import type { DerivedPlant } from '../../types'

/**
 * One open habit in "Today". The left side opens the detail sheet, the right
 * side waters. Two sibling buttons, never nested.
 */

const DROP_ICON_SIZE = 21

interface TodayRowProps {
  plant: DerivedPlant
  onWater: () => void
  onOpen: () => void
}

export const TodayRow = ({ plant, onWater, onOpen }: TodayRowProps) => {
  const { pouring, pour } = useDroplet()

  const water = () => {
    pour()
    onWater()
  }

  return (
    <li className="bg-surface shadow-card animate-enter flex items-center gap-3.5 rounded-lg px-3.5 py-3">
      <button
        type="button"
        onClick={onOpen}
        aria-label={t('garden.openPlant', { habit: plant.habitName })}
        className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
      >
        <span className="bg-bed flex h-14 w-13 flex-none items-end justify-center rounded-sm">
          <Plant
            species={plant.species}
            growthStage={plant.state.growthStage}
            healthState={plant.state.healthState}
            size={PLANT_SIZE.row}
            showDropHint={false}
            pouring={pouring}
          />
        </span>

        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm leading-tight font-medium">{plant.habitName}</span>
          <span className="text-muted text-xs">
            {t('today.meta', {
              rhythm: rhythmLabel(plant.intervalDays),
              stage: stageLabel(plant.state.growthStage),
            })}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={water}
        aria-label={t('today.waterAction', { habit: plant.habitName })}
        className="bg-primary text-on-primary shadow-primary flex h-[46px] w-[46px] flex-none items-center justify-center rounded-sm transition-transform duration-200 active:scale-95"
      >
        <WaterDropIcon size={DROP_ICON_SIZE} />
      </button>
    </li>
  )
}

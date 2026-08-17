import { useId, useState } from 'react'

import { CheckIcon, ChevronDownIcon } from '../../components/icons'
import { Plant } from '../../components/plant/Plant'
import { PLANT_SIZE } from '../../config/plant-visuals'
import { t } from '../../i18n'
import type { DerivedPlant } from '../../types'

/**
 * What has already been watered today. Collapsed, so "Today" shows what is still
 * open rather than what is already done.
 */

const CHECK_ICON_SIZE = 18
const CHEVRON_ICON_SIZE = 16

interface DoneSectionProps {
  plants: readonly DerivedPlant[]
}

export const DoneSection = ({ plants }: DoneSectionProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const listId = useId()

  return (
    <div className="pt-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={listId}
        className="bg-bed text-muted flex w-full items-center justify-between rounded-md px-4 py-3.5 text-[13px] font-medium"
      >
        <span>{t('today.doneToggle', { count: plants.length })}</span>
        <span className={`flex transition-transform duration-250 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDownIcon size={CHEVRON_ICON_SIZE} />
        </span>
      </button>

      {isOpen && (
        <ul id={listId} className="animate-enter flex flex-col gap-2 pt-2.5">
          {plants.map((plant) => (
            <li
              key={plant.id}
              className="bg-surface flex items-center gap-3 rounded-md px-3.5 py-2.5 opacity-70"
            >
              <span className="flex h-11 w-9 flex-none items-end justify-center">
                <Plant
                  species={plant.species}
                  growthStage={plant.state.growthStage}
                  healthState={plant.state.healthState}
                  size={PLANT_SIZE.rowDone}
                  showDropHint={false}
                />
              </span>

              <span className="flex-1 truncate text-[13px] font-medium">{plant.habitName}</span>
              <CheckIcon size={CHECK_ICON_SIZE} className="text-primary flex-none" />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

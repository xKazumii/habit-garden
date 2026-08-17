import { useId } from 'react'

import { Plant } from '../../components/plant/Plant'
import { RhythmPicker } from '../../components/RhythmPicker'
import { PLANT_SIZE } from '../../config/plant-visuals'
import { t } from '../../i18n'
import { categoryName, speciesName } from '../../i18n/labels'
import type { PlantCategory } from '../../types'
import type { PlantDraft } from './draft'

/**
 * Schritt 3: Name und Rhythmus. Hier entsteht aus einer Sorte eine Gewohnheit.
 */

const PREVIEW_STAGE = 3

interface HabitStepProps {
  category: PlantCategory
  species: string
  draft: PlantDraft
  onChange: (patch: Partial<PlantDraft>) => void
}

export const HabitStep = ({ category, species, draft, onChange }: HabitStepProps) => {
  const habitFieldId = useId()

  return (
    <div className="flex flex-col gap-5.5">
      <div className="bg-bed flex items-center gap-4 rounded-lg px-4 py-3.5">
        <span className="flex h-[66px] w-14 flex-none items-end justify-center">
          <Plant
            species={species}
            growthStage={PREVIEW_STAGE}
            healthState="healthy"
            size={PLANT_SIZE.preview}
            showDropHint={false}
          />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-[15px] leading-tight font-semibold">{speciesName(species)}</span>
          <span className="text-muted text-xs">{categoryName(category)}</span>
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <label htmlFor={habitFieldId} className="text-[13px] font-medium">
          {t('create.habitLabel')}
        </label>
        <input
          id={habitFieldId}
          type="text"
          value={draft.habitName}
          onChange={(event) => onChange({ habitName: event.target.value })}
          placeholder={t('create.habitPlaceholder')}
          autoComplete="off"
          className="bg-surface shadow-card text-ink placeholder:text-muted w-full rounded-md px-4 py-[15px] text-sm outline-none"
        />
      </div>

      <RhythmPicker
        intervalDays={draft.intervalDays}
        isCustom={draft.usesCustomRhythm}
        onChange={(intervalDays, usesCustomRhythm) => onChange({ intervalDays, usesCustomRhythm })}
      />
    </div>
  )
}

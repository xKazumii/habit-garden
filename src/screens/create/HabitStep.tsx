import { Plant } from '../../components/plant/Plant'
import { RhythmPicker } from '../../components/RhythmPicker'
import { TextField } from '../../components/TextField'
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

export const HabitStep = ({ category, species, draft, onChange }: HabitStepProps) => (
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

    <TextField
      label={t('create.habitLabel')}
      value={draft.habitName}
      onChange={(habitName) => onChange({ habitName })}
      placeholder={t('create.habitPlaceholder')}
      autoComplete="off"
    />

    <RhythmPicker
      intervalDays={draft.intervalDays}
      isCustom={draft.usesCustomRhythm}
      onChange={(intervalDays, usesCustomRhythm) => onChange({ intervalDays, usesCustomRhythm })}
    />
  </div>
)

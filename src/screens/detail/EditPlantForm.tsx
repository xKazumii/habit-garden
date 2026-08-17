import { useState } from 'react'

import { PrimaryButton } from '../../components/PrimaryButton'
import { RhythmPicker } from '../../components/RhythmPicker'
import { SecondaryButton } from '../../components/SecondaryButton'
import { TextField } from '../../components/TextField'
import { RHYTHM_PRESET_DAYS } from '../../config/rhythms'
import type { PlantEdit } from '../../db/plants'
import { t } from '../../i18n'
import type { DerivedPlant } from '../../types'

/**
 * Editing inside the sheet. Only the name and the rhythm can change — species and
 * category stay, because the plant grew with them.
 *
 * A longer rhythm does not revive a dead plant: `status` is deliberately sticky
 * in the data layer.
 */

interface EditPlantFormProps {
  plant: DerivedPlant
  onSave: (changes: PlantEdit) => void
  onCancel: () => void
}

export const EditPlantForm = ({ plant, onSave, onCancel }: EditPlantFormProps) => {
  const [habitName, setHabitName] = useState(plant.habitName)
  const [intervalDays, setIntervalDays] = useState(plant.intervalDays)
  const [isCustom, setIsCustom] = useState(() => !RHYTHM_PRESET_DAYS.includes(plant.intervalDays))

  const canSave = habitName.trim().length > 0

  return (
    <div className="animate-enter flex flex-col gap-5 pb-1">
      <h3 className="text-[15px] font-semibold">{t('detail.editTitle')}</h3>

      <TextField
        label={t('create.habitLabel')}
        value={habitName}
        onChange={setHabitName}
        autoComplete="off"
      />

      <RhythmPicker
        intervalDays={intervalDays}
        isCustom={isCustom}
        onChange={(days, custom) => {
          setIntervalDays(days)
          setIsCustom(custom)
        }}
      />

      <div className="flex items-stretch gap-2">
        <SecondaryButton onClick={onCancel}>{t('detail.editCancel')}</SecondaryButton>
        <span className="flex-1">
          <PrimaryButton onClick={() => onSave({ habitName, intervalDays })} disabled={!canSave}>
            {t('detail.editSave')}
          </PrimaryButton>
        </span>
      </div>
    </div>
  )
}

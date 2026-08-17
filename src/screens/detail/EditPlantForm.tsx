import { useId, useState } from 'react'

import { PrimaryButton } from '../../components/PrimaryButton'
import { RhythmPicker } from '../../components/RhythmPicker'
import { SecondaryButton } from '../../components/SecondaryButton'
import { RHYTHM_PRESET_DAYS } from '../../config/rhythms'
import type { PlantEdit } from '../../db/plants'
import { t } from '../../i18n'
import type { DerivedPlant } from '../../types'

/**
 * Bearbeiten im Sheet. Änderbar sind nur Name und Rhythmus — Art und Kategorie
 * bleiben, denn die Pflanze ist mit ihnen gewachsen.
 *
 * Ein verlängerter Rhythmus erweckt eine eingegangene Pflanze nicht wieder:
 * `status` ist in der Datenschicht bewusst klebrig.
 */

interface EditPlantFormProps {
  plant: DerivedPlant
  onSave: (changes: PlantEdit) => void
  onCancel: () => void
}

export const EditPlantForm = ({ plant, onSave, onCancel }: EditPlantFormProps) => {
  const habitFieldId = useId()
  const [habitName, setHabitName] = useState(plant.habitName)
  const [intervalDays, setIntervalDays] = useState(plant.intervalDays)
  const [isCustom, setIsCustom] = useState(() => !RHYTHM_PRESET_DAYS.includes(plant.intervalDays))

  const canSave = habitName.trim().length > 0

  return (
    <div className="animate-enter flex flex-col gap-5 pb-1">
      <h3 className="text-[15px] font-semibold">{t('detail.editTitle')}</h3>

      <div className="flex flex-col gap-2.5">
        <label htmlFor={habitFieldId} className="text-[13px] font-medium">
          {t('create.habitLabel')}
        </label>
        <input
          id={habitFieldId}
          type="text"
          value={habitName}
          onChange={(event) => setHabitName(event.target.value)}
          autoComplete="off"
          className="bg-surface shadow-card text-ink w-full rounded-md px-4 py-[15px] text-sm outline-none"
        />
      </div>

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

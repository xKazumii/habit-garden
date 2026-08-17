import { MAX_INTERVAL_DAYS, MIN_INTERVAL_DAYS } from '../config/growth'
import { RHYTHM_PRESET_DAYS } from '../config/rhythms'
import { t } from '../i18n'
import { rhythmLabel } from '../i18n/labels'
import { Pill } from './Pill'
import { TextField } from './TextField'

/**
 * Pick a rhythm: presets as chips, everything else via "custom value".
 * Shared by the planting flow and by editing in the detail sheet.
 */

const clampIntervalDays = (days: number): number =>
  Math.min(MAX_INTERVAL_DAYS, Math.max(MIN_INTERVAL_DAYS, days))

interface RhythmPickerProps {
  intervalDays: number
  /**
   * "Custom value" is active. Deliberately separate from the number: otherwise
   * the selection would jump back as soon as someone happens to type a 7.
   */
  isCustom: boolean
  onChange: (intervalDays: number, isCustom: boolean) => void
}

export const RhythmPicker = ({ intervalDays, isCustom, onChange }: RhythmPickerProps) => {
  const onCustomDays = (value: string) => {
    const parsed = Number.parseInt(value, 10)
    onChange(Number.isNaN(parsed) ? MIN_INTERVAL_DAYS : clampIntervalDays(parsed), true)
  }

  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[13px] font-medium">{t('create.rhythmLabel')}</span>

      <div className="flex flex-wrap gap-2">
        {RHYTHM_PRESET_DAYS.map((days) => (
          <Pill
            key={days}
            selected={!isCustom && intervalDays === days}
            onClick={() => onChange(days, false)}
          >
            {rhythmLabel(days)}
          </Pill>
        ))}

        <Pill selected={isCustom} onClick={() => onChange(intervalDays, true)}>
          {t('rhythm.custom')}
        </Pill>
      </div>

      {isCustom && (
        <div className="animate-enter pt-1.5">
          <TextField
            label={t('create.customDaysLabel')}
            value={String(intervalDays)}
            onChange={onCustomDays}
            hint={t('create.customDaysHint', { min: MIN_INTERVAL_DAYS, max: MAX_INTERVAL_DAYS })}
            type="number"
            inputMode="numeric"
            min={MIN_INTERVAL_DAYS}
            max={MAX_INTERVAL_DAYS}
          />
        </div>
      )}
    </div>
  )
}

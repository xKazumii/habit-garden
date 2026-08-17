import { useId, type ChangeEvent } from 'react'

import { MAX_INTERVAL_DAYS, MIN_INTERVAL_DAYS } from '../config/growth'
import { RHYTHM_PRESET_DAYS } from '../config/rhythms'
import { t } from '../i18n'
import { rhythmLabel } from '../i18n/labels'
import { Pill } from './Pill'

/**
 * Rhythmus wählen: Presets als Chips, alles andere über „eigener Wert".
 * Gemeinsam genutzt vom Anpflanz-Flow und vom Bearbeiten im Detail-Sheet.
 */

const clampIntervalDays = (days: number): number =>
  Math.min(MAX_INTERVAL_DAYS, Math.max(MIN_INTERVAL_DAYS, days))

interface RhythmPickerProps {
  intervalDays: number
  /**
   * „Eigener Wert" ist aktiv. Bewusst getrennt vom Zahlenwert: sonst würde die
   * Auswahl zurückspringen, sobald jemand zufällig eine 7 eintippt.
   */
  isCustom: boolean
  onChange: (intervalDays: number, isCustom: boolean) => void
}

export const RhythmPicker = ({ intervalDays, isCustom, onChange }: RhythmPickerProps) => {
  const customFieldId = useId()

  const onCustomDays = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = Number.parseInt(event.target.value, 10)
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
        <div className="animate-enter flex flex-col gap-2.5 pt-1.5">
          <label htmlFor={customFieldId} className="text-[13px] font-medium">
            {t('create.customDaysLabel')}
          </label>
          <input
            id={customFieldId}
            type="number"
            inputMode="numeric"
            min={MIN_INTERVAL_DAYS}
            max={MAX_INTERVAL_DAYS}
            value={intervalDays}
            onChange={onCustomDays}
            className="bg-surface shadow-card text-ink w-full rounded-md px-4 py-[15px] text-sm outline-none"
          />
          <span className="text-muted text-xs">
            {t('create.customDaysHint', { min: MIN_INTERVAL_DAYS, max: MAX_INTERVAL_DAYS })}
          </span>
        </div>
      )}
    </div>
  )
}

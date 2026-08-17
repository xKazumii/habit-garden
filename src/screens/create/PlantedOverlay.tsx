import { useEffect } from 'react'

import { Plant as PlantIllustration } from '../../components/plant/Plant'
import { PLANT_SIZE } from '../../config/plant-visuals'
import { t } from '../../i18n'
import { rhythmLabel } from '../../i18n/labels'
import type { Plant } from '../../types'

/**
 * Kurze Bestätigung nach dem Anpflanzen. Verschwindet von selbst wieder —
 * ein Zwischenbild, kein Dialog, den man wegklicken muss.
 */

/** So lange bleibt die Bestätigung stehen. */
const VISIBLE_MS = 1700

/** Frisch gesät ist immer Stufe 0. */
const SEED_STAGE = 0

interface PlantedOverlayProps {
  plant: Plant
  onDismiss: () => void
}

export const PlantedOverlay = ({ plant, onDismiss }: PlantedOverlayProps) => {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, VISIBLE_MS)
    return () => window.clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className="bg-canvas animate-enter absolute inset-0 z-40 flex flex-col items-center justify-center gap-4.5 px-9 text-center">
      <button type="button" onClick={onDismiss} aria-label={t('detail.close')} className="absolute inset-0" />

      <span className="animate-pop relative">
        <PlantIllustration
          species={plant.species}
          growthStage={SEED_STAGE}
          healthState="healthy"
          size={PLANT_SIZE.planted}
          showDropHint={false}
        />
      </span>

      <h2 className="relative text-[19px] font-semibold">{t('create.planted.title')}</h2>
      <p aria-live="polite" className="text-muted relative max-w-[230px] text-[13.5px] leading-snug">
        {t('create.planted.body', {
          habit: plant.habitName,
          rhythm: rhythmLabel(plant.intervalDays),
        })}
      </p>
    </div>
  )
}

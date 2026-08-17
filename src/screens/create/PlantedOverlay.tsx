import { useEffect } from 'react'

import { Plant as PlantIllustration } from '../../components/plant/Plant'
import { PLANT_SIZE } from '../../config/plant-visuals'
import { t } from '../../i18n'
import { rhythmLabel } from '../../i18n/labels'
import type { Plant } from '../../types'

/**
 * A brief confirmation after planting. Disappears on its own — an interstitial,
 * not a dialog that has to be dismissed.
 */

/** How long the confirmation stays on screen. */
const VISIBLE_MS = 1700

/** Freshly sown is always stage 0. */
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

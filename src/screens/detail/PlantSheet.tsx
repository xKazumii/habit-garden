import { useId, useState } from 'react'

import { BottomSheet } from '../../components/BottomSheet'
import { Plant } from '../../components/plant/Plant'
import { PrimaryButton } from '../../components/PrimaryButton'
import { SecondaryButton } from '../../components/SecondaryButton'
import { PLANT_SIZE } from '../../config/plant-visuals'
import type { PlantEdit } from '../../db/plants'
import { t, tCount } from '../../i18n'
import { rhythmLabel, speciesName } from '../../i18n/labels'
import type { DerivedPlant } from '../../types'
import { EditPlantForm } from './EditPlantForm'
import { Heatmap } from './Heatmap'
import { StatCards } from './StatCards'

/**
 * Das Detail-Sheet. Drei Zustände in einem Sheet, damit man beim Bearbeiten
 * oder Ausgraben nicht die Pflanze aus den Augen verliert.
 */

type SheetMode = 'view' | 'edit' | 'confirmUproot'

interface PlantSheetProps {
  plant: DerivedPlant
  now: number
  onClose: () => void
  onWater: () => void
  onEdit: (changes: PlantEdit) => void
  onUproot: () => void
}

export const PlantSheet = ({
  plant,
  now,
  onClose,
  onWater,
  onEdit,
  onUproot,
}: PlantSheetProps) => {
  const [mode, setMode] = useState<SheetMode>('view')
  const titleId = useId()
  const { state } = plant

  const waterLabel =
    state.status === 'dead'
      ? t('detail.waterDead')
      : state.isDue
        ? t('detail.water')
        : tCount('detail.waterDueInDays', state.daysUntilDue)

  return (
    <BottomSheet onClose={onClose} labelledBy={titleId}>
      <div className="flex flex-col items-center gap-1.5 pt-1.5 pb-3">
        <span className="flex h-[170px] items-end justify-center">
          <Plant
            species={plant.species}
            growthStage={state.growthStage}
            healthState={state.healthState}
            size={PLANT_SIZE.detail}
          />
        </span>

        <h2 id={titleId} className="text-center text-[21px] leading-tight font-semibold">
          {plant.habitName}
        </h2>
        <p className="text-muted text-[13px]">
          {t('detail.subtitle', {
            species: speciesName(plant.species),
            rhythm: rhythmLabel(plant.intervalDays),
          })}
        </p>
      </div>

      {mode === 'edit' ? (
        <EditPlantForm
          plant={plant}
          onSave={(changes) => {
            onEdit(changes)
            setMode('view')
          }}
          onCancel={() => setMode('view')}
        />
      ) : (
        <>
          <StatCards plant={plant} />

          <PrimaryButton onClick={onWater} disabled={!state.isDue}>
            {waterLabel}
          </PrimaryButton>

          <Heatmap plant={plant} now={now} />

          {mode === 'confirmUproot' ? (
            <div className="animate-enter flex flex-col gap-3 pt-3.5">
              <div className="bg-accent-soft flex flex-col gap-1.5 rounded-md px-4 py-3.5">
                <h3 className="text-[13px] font-semibold">{t('detail.uprootConfirmTitle')}</h3>
                <p className="text-muted text-xs leading-relaxed">
                  {t('detail.uprootConfirmBody', { habit: plant.habitName })}
                </p>
              </div>

              <div className="flex gap-2">
                <SecondaryButton onClick={() => setMode('view')}>
                  {t('detail.uprootCancel')}
                </SecondaryButton>
                <SecondaryButton tone="danger" onClick={onUproot}>
                  {t('detail.uprootConfirm')}
                </SecondaryButton>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 pt-3.5">
              <SecondaryButton onClick={() => setMode('edit')}>{t('detail.edit')}</SecondaryButton>
              <SecondaryButton onClick={() => setMode('confirmUproot')}>
                {t('detail.uproot')}
              </SecondaryButton>
            </div>
          )}
        </>
      )}
    </BottomSheet>
  )
}

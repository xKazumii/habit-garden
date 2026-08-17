import { Plant } from '../../components/plant/Plant'
import { PrimaryButton } from '../../components/PrimaryButton'
import { PLANT_SIZE } from '../../config/plant-visuals'
import { SPECIES } from '../../config/species'
import { t } from '../../i18n'

/**
 * Leeres Beet. Zeigt einen Keimling als Versprechen, nicht als Datensatz.
 */

const PREVIEW_SPECIES = SPECIES[0]?.id ?? ''
const PREVIEW_STAGE = 1

interface EmptyGardenProps {
  onPlant: () => void
}

export const EmptyGarden = ({ onPlant }: EmptyGardenProps) => (
  <div className="animate-enter bg-surface shadow-card flex flex-col items-center gap-3 rounded-xl px-7 pt-7 pb-6 text-center">
    <Plant
      species={PREVIEW_SPECIES}
      growthStage={PREVIEW_STAGE}
      healthState="healthy"
      size={PLANT_SIZE.category}
      showDropHint={false}
    />

    <h2 className="text-[17px] font-semibold">{t('garden.empty.title')}</h2>
    <p className="text-muted pb-2 text-[13px] leading-relaxed">{t('garden.empty.body')}</p>

    <PrimaryButton onClick={onPlant}>{t('garden.empty.action')}</PrimaryButton>
  </div>
)

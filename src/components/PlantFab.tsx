import { t } from '../i18n'
import { PlusIcon } from './icons'

/**
 * Der Knopf zum Anpflanzen. Sitzt über der Tab Bar und liegt unter allen
 * Overlays, damit er im Detail-Sheet oder im Anpflanz-Flow nicht durchscheint.
 */

const ICON_SIZE = 26

interface PlantFabProps {
  onClick: () => void
}

export const PlantFab = ({ onClick }: PlantFabProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={t('garden.plantAction')}
    className="bg-accent text-on-accent shadow-accent bottom-safe-fab absolute right-5 z-10 flex h-15 w-15 items-center justify-center rounded-xl transition active:translate-y-0.5"
  >
    <PlusIcon size={ICON_SIZE} />
  </button>
)

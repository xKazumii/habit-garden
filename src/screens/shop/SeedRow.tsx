import { CheckIcon } from '../../components/icons'
import { Coin } from '../../components/Coin'
import { Plant } from '../../components/plant/Plant'
import { COIN_SIZE } from '../../config/coin'
import { PLANT_SIZE } from '../../config/plant-visuals'
import type { SpeciesDefinition } from '../../config/species'
import { t } from '../../i18n'
import { speciesName } from '../../i18n/labels'

/**
 * One species in the seed shop.
 *
 * Locked species stay visible — you should see what you are working towards.
 * What is not affordable yet recedes instead of disappearing.
 */

const PREVIEW_STAGE = 4
const CHECK_ICON_SIZE = 16

interface SeedRowProps {
  species: SpeciesDefinition
  owned: boolean
  /** Enough coins available. */
  affordable: boolean
  /** How many coins are still missing. */
  missing: number
  onBuy: () => void
}

export const SeedRow = ({ species, owned, affordable, missing, onBuy }: SeedRowProps) => {
  const name = speciesName(species.id)

  const preview = (
    <span className="bg-bed flex h-14 w-13 flex-none items-end justify-center rounded-sm">
      <Plant
        species={species.id}
        growthStage={PREVIEW_STAGE}
        healthState="healthy"
        size={PLANT_SIZE.row}
        showDropHint={false}
      />
    </span>
  )

  if (owned) {
    return (
      <li className="bg-surface shadow-card flex items-center gap-3.5 rounded-lg px-3.5 py-3">
        {preview}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{name}</span>
          <span className="text-primary flex items-center gap-1 text-xs">
            <CheckIcon size={CHECK_ICON_SIZE} />
            {t('shop.owned')}
          </span>
        </span>
      </li>
    )
  }

  return (
    <li>
      <button
        type="button"
        onClick={onBuy}
        disabled={!affordable}
        aria-label={t('shop.buy', { species: name, price: species.price })}
        className={`bg-surface shadow-card flex w-full items-center gap-3.5 rounded-lg px-3.5 py-3 text-left transition ${
          affordable ? '' : 'opacity-60'
        }`}
      >
        {preview}

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{name}</span>
          {!affordable && (
            <span className="text-muted text-xs">{t('shop.missing', { count: missing })}</span>
          )}
        </span>

        <span
          className={`flex flex-none items-center gap-1.5 rounded-sm px-2.5 py-2 text-[13px] font-semibold ${
            affordable ? 'bg-accent-soft text-accent' : 'bg-inert text-muted'
          }`}
        >
          <Coin size={COIN_SIZE.chip} />
          {species.price}
        </span>
      </button>
    </li>
  )
}

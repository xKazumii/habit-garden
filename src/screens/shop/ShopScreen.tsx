import { useState } from 'react'

import { Coin } from '../../components/Coin'
import { CloseIcon } from '../../components/icons'
import { COIN_SIZE } from '../../config/coin'
import { CATEGORY_ORDER, speciesByCategory } from '../../config/species'
import { purchaseSeed } from '../../db/settings'
import { t, tCount } from '../../i18n'
import { categoryName } from '../../i18n/labels'
import { coinBalance } from '../../lib/coins'
import { TOTAL_SPECIES_COUNT, unlockedCount, unlockedSpeciesIds } from '../../lib/shop'
import type { GardenSettings, Plant } from '../../types'
import { SeedRow } from './SeedRow'

/**
 * The seed shop. A full-screen overlay like the planting flow — deliberately not
 * a fourth tab, the app stays at three areas.
 *
 * It buys on its own and hands nothing upwards: the data layer checks the balance
 * inside a transaction, and the result is visible here right away.
 */

const ICON_SIZE = 18

interface ShopScreenProps {
  plants: readonly Plant[]
  settings: GardenSettings
  onClose: () => void
}

export const ShopScreen = ({ plants, settings, onClose }: ShopScreenProps) => {
  const [isBuying, setIsBuying] = useState(false)

  const balance = coinBalance(plants, settings)
  const unlocked = unlockedSpeciesIds(settings, plants)
  const owned = unlockedCount(settings, plants)

  const buy = async (speciesId: string) => {
    if (isBuying) return
    setIsBuying(true)
    try {
      await purchaseSeed(speciesId)
    } catch (error: unknown) {
      console.error('[shop] Purchase failed', error)
    } finally {
      setIsBuying(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('shop.title')}
      className="bg-canvas animate-rise pt-safe absolute inset-0 z-30 flex flex-col"
    >
      <div className="flex flex-none items-center justify-between px-5.5 pt-6 pb-2">
        <h1 className="text-2xl leading-tight font-semibold tracking-tight">{t('shop.title')}</h1>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('shop.close')}
          className="bg-bed text-ink flex h-[38px] w-[38px] flex-none items-center justify-center rounded-sm"
        >
          <CloseIcon size={ICON_SIZE} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5.5 pt-2 pb-6.5">
        <div className="bg-surface shadow-card mb-5 flex items-center gap-4 rounded-xl px-4.5 py-4">
          <Coin size={COIN_SIZE.hero} variant="stack" />
          <div className="flex flex-col gap-1">
            <span className="text-accent text-xl font-semibold">
              {tCount('shop.balanceLabel', balance)}
            </span>
            <span className="text-muted text-xs leading-snug">
              {owned === TOTAL_SPECIES_COUNT
                ? t('shop.allOwned')
                : t('shop.progress', { owned, total: TOTAL_SPECIES_COUNT })}
            </span>
          </div>
        </div>

        <p className="text-muted mb-6 px-0.5 text-sm leading-relaxed">{t('shop.body')}</p>

        {CATEGORY_ORDER.map((category) => (
          <section key={category} className="pb-6">
            <h2 className="text-muted px-0.5 pb-2.5 text-[11px] tracking-[0.08em] uppercase">
              {categoryName(category)}
            </h2>

            <ul className="flex flex-col gap-2">
              {speciesByCategory(category).map((species) => (
                <SeedRow
                  key={species.id}
                  species={species}
                  owned={unlocked.has(species.id)}
                  affordable={balance >= species.price}
                  missing={Math.max(0, species.price - balance)}
                  onBuy={() => void buy(species.id)}
                />
              ))}
            </ul>
          </section>
        ))}

        <section className="bg-surface shadow-card flex flex-col gap-1.5 rounded-lg px-4.5 py-4">
          <h2 className="text-sm font-medium">{t('shop.earning.title')}</h2>
          <p className="text-muted text-xs leading-relaxed">{t('shop.earning.watering')}</p>
          <p className="text-muted text-xs leading-relaxed">{t('shop.earning.streak')}</p>
        </section>
      </div>
    </div>
  )
}

import { useCallback, useState, type ReactNode } from 'react'

import { CoinReward, type CoinRewardState } from './components/CoinReward'
import { PlantFab } from './components/PlantFab'
import { TabBar } from './components/TabBar'
import { UpdateBanner } from './components/UpdateBanner'
import { COINS_PER_WATERING } from './config/economy'
import { DEFAULT_TAB, type TabId } from './config/tabs'
import { editPlant, uprootPlant, waterPlant, type PlantEdit } from './db/plants'
import { completeOnboarding } from './db/settings'
import { useNow } from './hooks/useNow'
import { usePlants } from './hooks/usePlants'
import { useAppUpdate } from './hooks/useAppUpdate'
import { useSettings } from './hooks/useSettings'
import { useTheme } from './hooks/useTheme'
import { t } from './i18n'
import { coinBalance, coinsEarnedFor } from './lib/coins'
import { derivePlantState } from './lib/growth'
import { unlockedSpeciesIds } from './lib/shop'
import { CreateFlow } from './screens/create/CreateFlow'
import { PlantedOverlay } from './screens/create/PlantedOverlay'
import { PlantSheet } from './screens/detail/PlantSheet'
import { GardenScreen } from './screens/garden/GardenScreen'
import { WelcomeScreen } from './screens/onboarding/WelcomeScreen'
import { SettingsScreen } from './screens/settings/SettingsScreen'
import { ShopScreen } from './screens/shop/ShopScreen'
import { TodayScreen } from './screens/today/TodayScreen'
import type { Plant } from './types'

/**
 * The shell: one tab area with the overlays on top.
 *
 * No router — the active tab is state so that GitHub Pages needs no SPA
 * fallback. All plant state comes from IndexedDB and is derived from timestamps
 * on every render; what lives here is only what is currently open.
 *
 * `useTheme()` sits here deliberately: the hook keeps the attribute on `<html>`
 * current and therefore has to live as long as the app does.
 */

const logFailure = (what: string) => (error: unknown) => console.error(`[db] ${what}`, error)

export const App = () => {
  const now = useNow()
  const plants = usePlants(now)
  const settings = useSettings()
  const theme = useTheme()
  const update = useAppUpdate()

  const [tab, setTab] = useState<TabId>(DEFAULT_TAB)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isShopping, setIsShopping] = useState(false)
  const [justPlanted, setJustPlanted] = useState<Plant | null>(null)
  const [reward, setReward] = useState<CoinRewardState | null>(null)

  const selected = plants?.find((plant) => plant.id === selectedId) ?? null

  /**
   * Waters, then shows what it earned.
   *
   * The gain is computed from the before/after of the same plant — the coin
   * logic stays the single source, nothing is recalculated here. Anything above
   * the base coin means a streak milestone was reached.
   */
  const water = async (id: string) => {
    const before = plants?.find((plant) => plant.id === id)

    const outcome = await waterPlant(id)
    if (!outcome.ok || !before) return

    const gained = coinsEarnedFor(outcome.plant) - coinsEarnedFor(before)
    if (gained <= 0) return

    const bonus = gained - COINS_PER_WATERING
    const streak = derivePlantState(outcome.plant, now).streak

    // Several plants watered in quick succession: add the amounts up.
    setReward((current) => ({
      coins: (current?.coins ?? 0) + gained,
      streak: bonus > 0 ? streak : (current?.streak ?? 0),
      milestone: (current?.milestone ?? false) || bonus > 0,
    }))
  }

  const waterAndForget = (id: string) =>
    void water(id).catch(logFailure('watering failed'))

  const edit = (id: string, changes: PlantEdit) =>
    void editPlant(id, changes).catch(logFailure('editing failed'))

  const uproot = (id: string) => {
    setSelectedId(null)
    void uprootPlant(id).catch(logFailure('uprooting failed'))
  }

  const onPlanted = (plant: Plant) => {
    setIsCreating(false)
    setJustPlanted(plant)
    setTab('garden')
  }

  /* Stable, otherwise every render would restart the confirmation timer. */
  const dismissPlanted = useCallback(() => setJustPlanted(null), [])
  const dismissReward = useCallback(() => setReward(null), [])

  const finishOnboarding = (name: string) =>
    void completeOnboarding(name).catch(logFailure('saving the greeting failed'))

  const content = (): ReactNode => {
    // Only once both are here is it settled whether the greeting is needed.
    if (plants === undefined || settings === undefined) {
      return <p className="text-muted flex-1 pt-16 text-center text-sm">{t('shell.loading')}</p>
    }

    if (settings.onboardedAt === null) {
      return <WelcomeScreen onDone={finishOnboarding} />
    }

    const hasOverlay = selected !== null || isCreating || isShopping || justPlanted !== null
    const showFab = tab === 'garden' && !hasOverlay && plants.length > 0

    const balance = coinBalance(plants, settings)
    const unlocked = unlockedSpeciesIds(settings, plants)

    return (
      <>
        <main className="pt-safe flex-1 overflow-y-auto">
          {tab === 'garden' ? (
            <GardenScreen
              plants={plants}
              now={now}
              gardenerName={settings.gardenerName}
              balance={balance}
              onOpenPlant={setSelectedId}
              onPlant={() => setIsCreating(true)}
              onOpenShop={() => setIsShopping(true)}
            />
          ) : tab === 'today' ? (
            <TodayScreen
              plants={plants}
              now={now}
              onWater={waterAndForget}
              onOpenPlant={setSelectedId}
            />
          ) : (
            <SettingsScreen plants={plants} settings={settings} theme={theme} update={update} />
          )}
        </main>

        <TabBar active={tab} onChange={setTab} />

        {showFab && <PlantFab onClick={() => setIsCreating(true)} />}

        {selected && (
          <PlantSheet
            plant={selected}
            now={now}
            onClose={() => setSelectedId(null)}
            onWater={() => waterAndForget(selected.id)}
            onEdit={(changes) => edit(selected.id, changes)}
            onUproot={() => uproot(selected.id)}
          />
        )}

        {isCreating && (
          <CreateFlow
            unlocked={unlocked}
            onClose={() => setIsCreating(false)}
            onPlanted={onPlanted}
          />
        )}

        {isShopping && (
          <ShopScreen plants={plants} settings={settings} onClose={() => setIsShopping(false)} />
        )}

        {justPlanted && <PlantedOverlay plant={justPlanted} onDismiss={dismissPlanted} />}

        {reward && <CoinReward reward={reward} onDone={dismissReward} />}
      </>
    )
  }

  return (
    /* No pt-safe here: that belongs on the scrolling content so overlays also
       cover the area under the notch. */
    <div className="pl-safe pr-safe relative mx-auto flex h-svh w-full max-w-md flex-col overflow-hidden">
      {content()}

      {/* Outside content() so it also shows while loading or onboarding. */}
      {update.ready && <UpdateBanner onApply={update.apply} applying={update.applying} />}
    </div>
  )
}

import { useCallback, useState, type ReactNode } from 'react'

import { PlantFab } from './components/PlantFab'
import { TabBar } from './components/TabBar'
import { DEFAULT_TAB, type TabId } from './config/tabs'
import { editPlant, uprootPlant, waterPlant, type PlantEdit } from './db/plants'
import { completeOnboarding } from './db/settings'
import { useNow } from './hooks/useNow'
import { usePlants } from './hooks/usePlants'
import { useSettings } from './hooks/useSettings'
import { useTheme } from './hooks/useTheme'
import { t } from './i18n'
import { CreateFlow } from './screens/create/CreateFlow'
import { PlantedOverlay } from './screens/create/PlantedOverlay'
import { PlantSheet } from './screens/detail/PlantSheet'
import { GardenScreen } from './screens/garden/GardenScreen'
import { WelcomeScreen } from './screens/onboarding/WelcomeScreen'
import { SettingsScreen } from './screens/settings/SettingsScreen'
import { TodayScreen } from './screens/today/TodayScreen'
import type { Plant } from './types'

/**
 * Die Shell: ein Tab-Bereich, darüber die Overlays.
 *
 * Kein Router — der aktive Tab ist State, damit GitHub Pages keinen
 * SPA-Fallback braucht. Aller Zustand der Pflanzen kommt aus IndexedDB und wird
 * bei jedem Render aus Zeitstempeln abgeleitet; hier steht nur, was gerade
 * offen ist.
 *
 * `useTheme()` steht bewusst hier: der Hook hält das Attribut auf `<html>`
 * aktuell und muss deshalb so lange leben wie die App.
 */

const logFailure = (what: string) => (error: unknown) => console.error(`[db] ${what}`, error)

export const App = () => {
  const now = useNow()
  const plants = usePlants(now)
  const settings = useSettings()
  const theme = useTheme()

  const [tab, setTab] = useState<TabId>(DEFAULT_TAB)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [justPlanted, setJustPlanted] = useState<Plant | null>(null)

  const selected = plants?.find((plant) => plant.id === selectedId) ?? null

  const water = (id: string) => void waterPlant(id).catch(logFailure('Gießen fehlgeschlagen'))

  const edit = (id: string, changes: PlantEdit) =>
    void editPlant(id, changes).catch(logFailure('Bearbeiten fehlgeschlagen'))

  const uproot = (id: string) => {
    setSelectedId(null)
    void uprootPlant(id).catch(logFailure('Ausgraben fehlgeschlagen'))
  }

  const onPlanted = (plant: Plant) => {
    setIsCreating(false)
    setJustPlanted(plant)
    setTab('garden')
  }

  /* Stabil, sonst würde jeder Render den Timer der Bestätigung neu starten. */
  const dismissPlanted = useCallback(() => setJustPlanted(null), [])

  const finishOnboarding = (name: string) =>
    void completeOnboarding(name).catch(logFailure('Begrüßung speichern fehlgeschlagen'))

  const content = (): ReactNode => {
    // Erst wenn beides da ist, steht fest, ob die Begrüßung nötig ist.
    if (plants === undefined || settings === undefined) {
      return <p className="text-muted flex-1 pt-16 text-center text-sm">{t('shell.loading')}</p>
    }

    if (settings.onboardedAt === null) {
      return <WelcomeScreen onDone={finishOnboarding} />
    }

    const hasOverlay = selected !== null || isCreating || justPlanted !== null
    const showFab = tab === 'garden' && !hasOverlay && plants.length > 0

    return (
      <>
        <main className="pt-safe flex-1 overflow-y-auto">
          {tab === 'garden' ? (
            <GardenScreen
              plants={plants}
              now={now}
              gardenerName={settings.gardenerName}
              onOpenPlant={setSelectedId}
              onPlant={() => setIsCreating(true)}
            />
          ) : tab === 'today' ? (
            <TodayScreen plants={plants} now={now} onWater={water} onOpenPlant={setSelectedId} />
          ) : (
            <SettingsScreen plants={plants} settings={settings} theme={theme} />
          )}
        </main>

        <TabBar active={tab} onChange={setTab} />

        {showFab && <PlantFab onClick={() => setIsCreating(true)} />}

        {selected && (
          <PlantSheet
            plant={selected}
            now={now}
            onClose={() => setSelectedId(null)}
            onWater={() => water(selected.id)}
            onEdit={(changes) => edit(selected.id, changes)}
            onUproot={() => uproot(selected.id)}
          />
        )}

        {isCreating && <CreateFlow onClose={() => setIsCreating(false)} onPlanted={onPlanted} />}

        {justPlanted && <PlantedOverlay plant={justPlanted} onDismiss={dismissPlanted} />}
      </>
    )
  }

  return (
    /* Kein pt-safe hier: das gehört an den scrollenden Inhalt, damit Overlays
       den Bereich unter der Notch mit abdecken. */
    <div className="pl-safe pr-safe relative mx-auto flex h-svh w-full max-w-md flex-col overflow-hidden">
      {content()}
    </div>
  )
}

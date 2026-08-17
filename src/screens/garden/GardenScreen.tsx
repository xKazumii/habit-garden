import { t, tCount } from '../../i18n'
import { daytimeFor } from '../../lib/greeting'
import type { DerivedPlant } from '../../types'
import { EmptyGarden } from './EmptyGarden'
import { GardenCell } from './GardenCell'

/**
 * Der Garten: Tagesgruß, wie viele Pflanzen Wasser brauchen, darunter das Beet.
 *
 * Der Zähler oben rechts ist bewusst `aria-hidden` — die Zeile darüber sagt
 * dasselbe schon in Worten, zweimal vorgelesen wäre er nur Lärm.
 */

interface GardenScreenProps {
  plants: readonly DerivedPlant[]
  now: number
  /** Leer, wenn beim Start übersprungen wurde — dann grüßt der Garten ohne. */
  gardenerName: string
  onOpenPlant: (id: string) => void
  onPlant: () => void
}

export const GardenScreen = ({
  plants,
  now,
  gardenerName,
  onOpenPlant,
  onPlant,
}: GardenScreenProps) => {
  const dueCount = plants.filter((plant) => plant.state.isDue).length

  const daytime = daytimeFor(now)
  const greeting = gardenerName
    ? t(`garden.greetingNamed.${daytime}`, { name: gardenerName })
    : t(`garden.greeting.${daytime}`)

  return (
    <div className="animate-enter px-5 pt-3.5 pb-7.5">
      <header className="flex items-start justify-between gap-3 px-1 pb-4.5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="text-[25px] leading-tight font-semibold tracking-tight">{greeting}</h1>
          <p className="text-muted text-sm">{tCount('garden.needsWater', dueCount)}</p>
        </div>

        <span
          aria-hidden="true"
          className="bg-surface text-primary shadow-card flex h-11 w-11 flex-none items-center justify-center rounded-md text-[15px] font-semibold"
        >
          {dueCount}
        </span>
      </header>

      {plants.length === 0 ? (
        <EmptyGarden onPlant={onPlant} />
      ) : (
        <div className="bg-bed shadow-bed rounded-bed px-3.5 py-4.5">
          <ul className="grid grid-cols-2 gap-2.5">
            {plants.map((plant) => (
              <li key={plant.id} className="flex">
                <GardenCell plant={plant} onOpen={() => onOpenPlant(plant.id)} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

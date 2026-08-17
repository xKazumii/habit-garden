import { t, tCount } from '../../i18n'
import { daytimeFor } from '../../lib/greeting'
import type { DerivedPlant } from '../../types'
import { CoinChip } from './CoinChip'
import { EmptyGarden } from './EmptyGarden'
import { GardenCell } from './GardenCell'

/**
 * The garden: greeting, how many plants need water, and the bed below.
 *
 * The counter in the top right is deliberately `aria-hidden` — the line above
 * already says the same thing in words, so reading it twice would be noise.
 */

interface GardenScreenProps {
  plants: readonly DerivedPlant[]
  now: number
  /** Empty when it was skipped at start — the garden then greets without it. */
  gardenerName: string
  balance: number
  onOpenPlant: (id: string) => void
  onPlant: () => void
  onOpenShop: () => void
}

export const GardenScreen = ({
  plants,
  now,
  gardenerName,
  balance,
  onOpenPlant,
  onPlant,
  onOpenShop,
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

        <div className="flex flex-none items-center gap-2">
          <CoinChip balance={balance} onOpenShop={onOpenShop} />

          <span
            aria-hidden="true"
            className="bg-surface text-primary shadow-card flex h-11 w-11 flex-none items-center justify-center rounded-md text-[15px] font-semibold"
          >
            {dueCount}
          </span>
        </div>
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

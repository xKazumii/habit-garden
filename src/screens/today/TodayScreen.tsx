import { t } from '../../i18n'
import { isSameLocalDay } from '../../lib/time'
import type { DerivedPlant } from '../../types'
import { DoneSection } from './DoneSection'
import { TodayRow } from './TodayRow'

/**
 * „Heute": was jetzt Wasser braucht. Erledigtes klappt weg, Eingegangenes
 * taucht hier gar nicht auf — das gehört in den Garten, nicht auf die Liste.
 */

interface TodayScreenProps {
  plants: readonly DerivedPlant[]
  now: number
  onWater: (id: string) => void
  onOpenPlant: (id: string) => void
}

export const TodayScreen = ({ plants, now, onWater, onOpenPlant }: TodayScreenProps) => {
  const due = plants.filter((plant) => plant.state.isDue)
  const done = plants.filter(
    (plant) => plant.lastWateredAt !== null && isSameLocalDay(plant.lastWateredAt, now),
  )

  const isEmpty = plants.length === 0

  return (
    <div className="animate-enter px-5.5 pt-3.5 pb-7.5">
      <h1 className="px-0.5 pb-1 text-[25px] leading-tight font-semibold tracking-tight">
        {t('today.title')}
      </h1>
      <p className="text-muted px-0.5 pb-5 text-sm">
        {isEmpty
          ? t('today.empty.title')
          : due.length === 0
            ? t('today.allDone')
            : t('today.summary', { open: due.length, done: done.length })}
      </p>

      {isEmpty ? (
        <p className="bg-surface shadow-card text-muted rounded-xl px-5 py-9 text-center text-sm leading-relaxed">
          {t('today.empty.body')}
        </p>
      ) : (
        <>
          {due.length > 0 ? (
            <ul className="flex flex-col gap-2.5">
              {due.map((plant) => (
                <TodayRow
                  key={plant.id}
                  plant={plant}
                  onWater={() => onWater(plant.id)}
                  onOpen={() => onOpenPlant(plant.id)}
                />
              ))}
            </ul>
          ) : (
            <p className="bg-surface shadow-card text-muted rounded-xl px-5 py-9 text-center text-sm leading-relaxed">
              {t('today.restingBody')}
            </p>
          )}

          {done.length > 0 && <DoneSection plants={done} />}
        </>
      )}
    </div>
  )
}

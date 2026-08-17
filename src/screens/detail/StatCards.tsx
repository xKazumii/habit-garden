import { MAX_GROWTH_STAGE } from '../../config/growth'
import { t, tCount } from '../../i18n'
import { healthLabel, stageLabel } from '../../i18n/labels'
import type { DerivedPlant, HealthState } from '../../types'

/**
 * Die beiden Kennzahlen über dem Gießen-Button: Wachstum und Streak.
 *
 * Der Zustand steht farbig unter dem Streak — er ist die Erklärung dafür, warum
 * eine Serie gerissen ist.
 */

/** Eine Marke je Stufe, gefüllt bis zur erreichten. */
const STAGE_PIPS = Array.from({ length: MAX_GROWTH_STAGE + 1 }, (_unused, index) => index)

const HEALTH_TEXT: Readonly<Record<HealthState, string>> = {
  healthy: 'text-healthy',
  thirsty: 'text-thirsty',
  wilting: 'text-wilting',
  dead: 'text-gone',
}

interface StatCardsProps {
  plant: DerivedPlant
}

export const StatCards = ({ plant }: StatCardsProps) => {
  const { state } = plant

  return (
    <div className="flex gap-2.5 pb-4">
      <div className="bg-surface shadow-card flex flex-1 flex-col gap-2 rounded-md p-3.5">
        <span className="text-muted text-[11px] tracking-[0.08em] uppercase">
          {t('detail.growth')}
        </span>
        <span className="text-[15px] font-semibold">{stageLabel(state.growthStage)}</span>

        <div
          role="img"
          aria-label={t('detail.stageProgress', {
            stage: state.growthStage + 1,
            max: MAX_GROWTH_STAGE + 1,
          })}
          className="flex gap-1"
        >
          {STAGE_PIPS.map((pip) => (
            <span
              key={pip}
              className={`h-[5px] flex-1 rounded-full ${
                pip <= state.growthStage ? 'bg-primary' : 'bg-inert'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="bg-surface shadow-card flex flex-1 flex-col gap-2 rounded-md p-3.5">
        <span className="text-muted text-[11px] tracking-[0.08em] uppercase">
          {t('detail.streak')}
        </span>
        <span className="text-[15px] font-semibold">
          {tCount('detail.streakCount', state.streak)}
        </span>
        <span className={`text-xs ${HEALTH_TEXT[state.healthState]}`}>
          {t('detail.healthState', { state: healthLabel(state.healthState) })}
        </span>
      </div>
    </div>
  )
}

import { DAYS_PER_WEEK, HEATMAP_WEEKS } from '../../config/heatmap'
import { t } from '../../i18n'
import { buildHeatmap, type HeatLevel } from '../../lib/heatmap'
import type { Plant } from '../../types'

/**
 * The last eight weeks as a grid. A column is seven consecutive days —
 * deliberately not aligned to weekdays, otherwise a partial column would be left
 * at the edge. The last cell is today.
 */

const CELL_SIZE_PX = 12
const PERCENT = 100

const LEVEL_CLASS: Readonly<Record<HeatLevel, string>> = {
  watered: 'bg-heat-full',
  idle: 'bg-heat-partial',
  missed: 'bg-heat-empty',
  before: 'bg-transparent',
}

interface HeatmapProps {
  plant: Plant
  now: number
}

export const Heatmap = ({ plant, now }: HeatmapProps) => {
  const { cells, rate } = buildHeatmap(plant, now)

  const rateLabel =
    rate === null
      ? t('detail.rateUnknown')
      : t('detail.rate', { percent: Math.round(rate * PERCENT) })

  return (
    <section className="pt-5.5 pb-1.5">
      <div className="flex items-baseline justify-between pb-2.5">
        <h3 className="text-[13px] font-medium">{t('detail.heatmapTitle')}</h3>
        <span className="text-muted text-[11px]">{rateLabel}</span>
      </div>

      <div
        role="img"
        aria-label={`${t('detail.heatmapTitle')}: ${rateLabel}`}
        className="grid grid-flow-col gap-1"
        style={{
          gridTemplateRows: `repeat(${DAYS_PER_WEEK}, ${CELL_SIZE_PX}px)`,
          gridTemplateColumns: `repeat(${HEATMAP_WEEKS}, 1fr)`,
        }}
      >
        {cells.map((cell) => (
          <span key={cell.day} className={`rounded-xs ${LEVEL_CLASS[cell.level]}`} />
        ))}
      </div>
    </section>
  )
}

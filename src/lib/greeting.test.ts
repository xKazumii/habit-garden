import { describe, expect, it } from 'vitest'

import { EVENING_FROM_HOUR, MORNING_UNTIL_HOUR } from '../config/greeting'
import { daytimeFor } from './greeting'

/** Zeitstempel zur lokalen Stunde eines beliebigen Tages. */
const atHour = (hour: number): number => new Date(2026, 5, 1, hour, 30, 0, 0).getTime()

describe('daytimeFor', () => {
  it('grüßt bis zur Morgengrenze mit Morgen', () => {
    expect(daytimeFor(atHour(0))).toBe('morning')
    expect(daytimeFor(atHour(MORNING_UNTIL_HOUR - 1))).toBe('morning')
  })

  it('grüßt dazwischen mit Tag', () => {
    expect(daytimeFor(atHour(MORNING_UNTIL_HOUR))).toBe('day')
    expect(daytimeFor(atHour(EVENING_FROM_HOUR - 1))).toBe('day')
  })

  it('grüßt ab der Abendgrenze mit Abend', () => {
    expect(daytimeFor(atHour(EVENING_FROM_HOUR))).toBe('evening')
    expect(daytimeFor(atHour(23))).toBe('evening')
  })
})

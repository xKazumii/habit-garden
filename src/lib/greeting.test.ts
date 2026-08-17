import { describe, expect, it } from 'vitest'

import { EVENING_FROM_HOUR, MORNING_UNTIL_HOUR } from '../config/greeting'
import { daytimeFor } from './greeting'

/** Timestamp at a local hour on an arbitrary day. */
const atHour = (hour: number): number => new Date(2026, 5, 1, hour, 30, 0, 0).getTime()

describe('daytimeFor', () => {
  it('greets with morning up to the morning boundary', () => {
    expect(daytimeFor(atHour(0))).toBe('morning')
    expect(daytimeFor(atHour(MORNING_UNTIL_HOUR - 1))).toBe('morning')
  })

  it('greets with day in between', () => {
    expect(daytimeFor(atHour(MORNING_UNTIL_HOUR))).toBe('day')
    expect(daytimeFor(atHour(EVENING_FROM_HOUR - 1))).toBe('day')
  })

  it('greets with evening from the evening boundary on', () => {
    expect(daytimeFor(atHour(EVENING_FROM_HOUR))).toBe('evening')
    expect(daytimeFor(atHour(23))).toBe('evening')
  })
})

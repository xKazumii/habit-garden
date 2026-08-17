import { EVENING_FROM_HOUR, MORNING_UNTIL_HOUR } from '../config/greeting'

/**
 * Time of day for the greeting in the garden. As everywhere in this app the
 * function receives `now` instead of looking at the clock itself — which makes it
 * testable without time travel.
 */
export type Daytime = 'morning' | 'day' | 'evening'

export const daytimeFor = (now: number): Daytime => {
  const hour = new Date(now).getHours()
  if (hour >= EVENING_FROM_HOUR) return 'evening'
  if (hour < MORNING_UNTIL_HOUR) return 'morning'
  return 'day'
}

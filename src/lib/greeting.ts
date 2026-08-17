import { EVENING_FROM_HOUR, MORNING_UNTIL_HOUR } from '../config/greeting'

/**
 * Tageszeit für den Gruß im Garten. Wie überall in dieser App bekommt die
 * Funktion `now` übergeben, statt selbst auf die Uhr zu sehen — dadurch
 * testbar ohne Zeitreise.
 */
export type Daytime = 'morning' | 'day' | 'evening'

export const daytimeFor = (now: number): Daytime => {
  const hour = new Date(now).getHours()
  if (hour >= EVENING_FROM_HOUR) return 'evening'
  if (hour < MORNING_UNTIL_HOUR) return 'morning'
  return 'day'
}

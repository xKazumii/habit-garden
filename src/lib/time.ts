/**
 * Kalendertag-Arithmetik.
 *
 * Die gesamte Fälligkeit der App rechnet in *lokalen Kalendertagen*, nicht in
 * 24-Stunden-Schritten. "Täglich" heißt einmal pro Kalendertag: wer um 23:50
 * gießt, darf am nächsten Morgen wieder gießen. Bei 24h-Arithmetik würde die
 * Fälligkeit mit jedem späten Gießen nach hinten wandern.
 *
 * Zeitstempel werden weiterhin als Epoch-Millisekunden gespeichert. Verglichen
 * wird ausschließlich über `dayNumber()`.
 */

const MS_PER_DAY = 86_400_000

/**
 * Fortlaufende Nummer des lokalen Kalendertags.
 *
 * Bewusst über die lokalen Kalenderfelder und `Date.UTC` — nicht über
 * `timestamp / MS_PER_DAY`. Dadurch ist die Funktion sommerzeitsicher: ein Tag
 * mit 23 oder 25 Stunden zählt trotzdem als genau ein Tag.
 */
export const dayNumber = (timestamp: number): number => {
  const date = new Date(timestamp)
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY)
}

/** Lokale Mitternacht des Tages, in dem `timestamp` liegt. */
export const startOfLocalDay = (timestamp: number): number => {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/**
 * Lokale Mitternacht `days` Kalendertage nach dem Tag von `timestamp`.
 * Rechnet über `setDate`, also über Kalenderfelder statt über Millisekunden.
 */
export const startOfLocalDayPlus = (timestamp: number, days: number): number => {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date.getTime()
}

/** Ganze Kalendertage von `from` bis `to`. Negativ, wenn `to` früher liegt. */
export const daysBetween = (from: number, to: number): number => dayNumber(to) - dayNumber(from)

export const isSameLocalDay = (a: number, b: number): boolean => dayNumber(a) === dayNumber(b)

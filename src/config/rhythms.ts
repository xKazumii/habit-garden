/**
 * Vorgeschlagene Rhythmen im Anpflanz-Flow. Alles außerhalb dieser Liste läuft
 * über „eigener Wert" und wird in src/db/plants.ts auf
 * MIN_INTERVAL_DAYS … MAX_INTERVAL_DAYS geklemmt.
 *
 * Die Beschriftungen kommen aus `rhythmLabel()` in src/i18n/labels.ts.
 */
export const RHYTHM_PRESET_DAYS: readonly number[] = [1, 2, 3, 7]

export const DEFAULT_INTERVAL_DAYS = 1

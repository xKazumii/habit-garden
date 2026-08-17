/**
 * Suggested rhythms in the planting flow. Anything outside this list goes
 * through "custom value" and is clamped to MIN_INTERVAL_DAYS …
 * MAX_INTERVAL_DAYS in src/db/plants.ts.
 *
 * The labels come from `rhythmLabel()` in src/i18n/labels.ts.
 */
export const RHYTHM_PRESET_DAYS: readonly number[] = [1, 2, 3, 7]

export const DEFAULT_INTERVAL_DAYS = 1

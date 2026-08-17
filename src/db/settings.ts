import { MAX_GARDENER_NAME_LENGTH } from '../config/settings'
import { priceOf } from '../config/species'
import { coinBalance } from '../lib/coins'
import type { GardenSettings, PurchasedSeed } from '../types'
import { db } from './db'

/**
 * Repository for the garden settings. Exactly one row with a fixed id.
 *
 * `getSettings()` always returns a complete object — the defaults are spread
 * beneath the stored record. That is why a new field needs no schema version: an
 * old entry without `purchases` yields the empty list rather than `undefined`.
 */

export const SETTINGS_ID = 'app'

const DEFAULT_SETTINGS: GardenSettings = {
  id: SETTINGS_ID,
  gardenerName: '',
  onboardedAt: null,
  bankedCoins: 0,
  purchases: [],
}

const normalizeName = (name: string): string => name.trim().slice(0, MAX_GARDENER_NAME_LENGTH)

export const getSettings = async (): Promise<GardenSettings> => ({
  ...DEFAULT_SETTINGS,
  ...(await db.settings.get(SETTINGS_ID)),
})

/** Only call this inside a running transaction. */
const readSettings = async (): Promise<GardenSettings> => ({
  ...DEFAULT_SETTINGS,
  ...(await db.settings.get(SETTINGS_ID)),
})

const patchSettings = (changes: Partial<GardenSettings>): Promise<void> =>
  db.transaction('rw', db.settings, async () => {
    const current = await readSettings()
    await db.settings.put({ ...current, ...changes, id: SETTINGS_ID })
  })

export const saveGardenerName = (name: string): Promise<void> =>
  patchSettings({ gardenerName: normalizeName(name) })

/**
 * Answers the first-start greeting. An empty name means "skipped" — the
 * timestamp makes sure it is not asked again.
 */
export const completeOnboarding = (name: string, now: number = Date.now()): Promise<void> =>
  patchSettings({ gardenerName: normalizeName(name), onboardedAt: now })

/**
 * Sets aside the coins of an uprooted plant.
 * Only call inside a running transaction that includes `settings`.
 */
export const bankCoins = async (coins: number): Promise<void> => {
  if (coins <= 0) return

  const current = await readSettings()
  await db.settings.put({ ...current, bankedCoins: current.bankedCoins + coins })
}

export type PurchaseFailure = 'unknown-species' | 'already-owned' | 'not-enough-coins'

export type PurchaseOutcome =
  | { ok: true; seed: PurchasedSeed }
  | { ok: false; reason: PurchaseFailure }

/**
 * Buys a seed.
 *
 * Checking and writing happen in **one** transaction across `plants` and
 * `settings` — otherwise two quick taps could charge twice. The balance has to be
 * read in the same transaction because it follows from the watering history.
 *
 * The price paid is stored alongside, so a later change to the price table does
 * not shift existing balances.
 */
export const purchaseSeed = (
  speciesId: string,
  now: number = Date.now(),
): Promise<PurchaseOutcome> =>
  db.transaction('rw', db.plants, db.settings, async () => {
    const price = priceOf(speciesId)
    if (price === undefined || price <= 0) return { ok: false, reason: 'unknown-species' }

    const settings = await readSettings()
    if (settings.purchases.some((purchase) => purchase.speciesId === speciesId)) {
      return { ok: false, reason: 'already-owned' }
    }

    const plants = await db.plants.toArray()
    if (coinBalance(plants, settings) < price) return { ok: false, reason: 'not-enough-coins' }

    const seed: PurchasedSeed = { speciesId, price, unlockedAt: now }
    await db.settings.put({ ...settings, purchases: [...settings.purchases, seed] })

    return { ok: true, seed }
  })

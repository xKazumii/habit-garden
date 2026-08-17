/** A plant's category — decides how many points one growth stage costs. */
export type PlantCategory = 'herb' | 'flower' | 'tree'

export type PlantStatus = 'alive' | 'dead'

/** 0 seed, 1 sprout, 2 young, 3 grown, 4 blooming. */
export type GrowthStage = 0 | 1 | 2 | 3 | 4

/**
 * Presentation state.
 * Precedence order: dead > wilting > thirsty > healthy.
 */
export type HealthState = 'healthy' | 'thirsty' | 'wilting' | 'dead'

/**
 * What actually lives in IndexedDB.
 *
 * Raw data only. Anything derivable from timestamps is NOT stored but
 * recomputed on every render — see `PlantState`.
 */
export interface Plant {
  id: string
  category: PlantCategory
  species: string
  habitName: string
  intervalDays: number
  createdAt: number
  lastWateredAt: number | null
  /** Timestamps of every watering, sorted ascending. */
  waterings: number[]
  growthPoints: number
  /**
   * Cached status so it is queryable in IndexedDB.
   * The truth lives in `PlantState.status`; the data layer writes a detected
   * 'dead' back. Once 'dead', always 'dead'.
   */
  status: PlantStatus
}

/**
 * A purchased seed. The price is **stored alongside it**: otherwise a later
 * change to the price table would retroactively shift the balance.
 */
export interface PurchasedSeed {
  speciesId: string
  price: number
  unlockedAt: number
}

/**
 * Garden settings. Exactly one row with a fixed id — there is only ever one
 * set, so no key-value schema.
 *
 * The theme deliberately does NOT live here but in localStorage: it has to be
 * readable synchronously before first paint, and it belongs to the device rather
 * than to the garden.
 */
export interface GardenSettings {
  id: string
  /** Empty when it was skipped at first start. */
  gardenerName: string
  /** When the greeting was answered. `null` = never shown. */
  onboardedAt: number | null
  /**
   * Coins from uprooted plants. Uprooting removes the history, so the earned
   * total would shrink — see src/lib/coins.ts.
   */
  bankedCoins: number
  purchases: PurchasedSeed[]
}

/** Fields needed to plant. Everything else is set by the data layer. */
export interface NewPlantInput {
  category: PlantCategory
  species: string
  habitName: string
  intervalDays: number
}

/**
 * Fully derived state. Never persisted.
 * Always computed from timestamps, never via timers or intervals.
 */
export interface PlantState {
  status: PlantStatus
  growthStage: GrowthStage
  /** 0–100. */
  health: number
  healthState: HealthState
  /** Watering is allowed. */
  isDue: boolean
  /** Grace period exceeded, health is already dropping. */
  isOverdue: boolean
  /** Number of intervals that already cost health. */
  missedIntervals: number
  /** Consecutive intervals without a miss. */
  streak: number
  /** Local midnight of the day watering becomes allowed. */
  dueAt: number
  /** Negative = overdue, 0 = due today, positive = time left. */
  daysUntilDue: number
  /** Points within the current stage. */
  pointsIntoStage: number
  /** Points one stage costs for this category. */
  pointsPerStage: number
  /** 0–1, progress towards the next stage. 1 at the highest stage. */
  stageProgress: number
}

/** Plant plus derived state — what the UI consumes. */
export interface DerivedPlant extends Plant {
  state: PlantState
}

/** Reasons the growth logic rejects a watering. */
export type WaterFailure = 'not-due' | 'dead'

/** Result of a watering attempt. No throwing, so the UI can read it directly. */
export type WaterOutcome = { ok: true; plant: Plant } | { ok: false; reason: WaterFailure }

/** Like `WaterOutcome`, but the data layer may also fail to find the plant. */
export type StoredWaterOutcome =
  | { ok: true; plant: Plant }
  | { ok: false; reason: WaterFailure | 'missing' }

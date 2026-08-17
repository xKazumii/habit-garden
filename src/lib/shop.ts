/**
 * Unlock state of the species. Pure, free of UI and database ties.
 */

import { SPECIES, STARTER_SPECIES_IDS } from '../config/species'
import type { GardenSettings, Plant } from '../types'

/**
 * Unlocked means: a starter species, a purchased one — or one that already has a
 * plant in the bed.
 *
 * The third case is a safeguard: an imported backup can bring plants of a
 * species that was never purchased. That must not leave the garden in a state
 * where a growing plant counts as locked. Useful side effect: species that used
 * to be starters stay usable.
 */
export const unlockedSpeciesIds = (
  settings: GardenSettings,
  plants: readonly Plant[],
): ReadonlySet<string> =>
  new Set([
    ...STARTER_SPECIES_IDS,
    ...settings.purchases.map((purchase) => purchase.speciesId),
    ...plants.map((plant) => plant.species),
  ])

export const isUnlocked = (
  speciesId: string,
  settings: GardenSettings,
  plants: readonly Plant[],
): boolean => unlockedSpeciesIds(settings, plants).has(speciesId)

/** How many species exist in total — for the progress line in the shop. */
export const TOTAL_SPECIES_COUNT = SPECIES.length

/**
 * How many species are unlocked. Counts known species only, so an unknown one
 * from a foreign backup cannot push progress past 100 %.
 */
export const unlockedCount = (settings: GardenSettings, plants: readonly Plant[]): number => {
  const unlocked = unlockedSpeciesIds(settings, plants)
  return SPECIES.reduce((total, species) => (unlocked.has(species.id) ? total + 1 : total), 0)
}

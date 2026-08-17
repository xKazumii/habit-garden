/**
 * Deterministic pseudo randomness for the plant illustration.
 *
 * Crowns, pebbles and the scatter of blossoms need to look irregular without
 * being random: the same species must look identical on every render and after
 * every reload. Everything is therefore derived from a hash of the species id —
 * `Math.random()` never appears.
 *
 * Pure, free of UI ties.
 */

const HASH_SEED = 7
const HASH_FACTOR = 31
const HASH_MODULO = 99_991

/** Stable hash of a string, used as the seed for one species. */
export const hashString = (value: string): number => {
  let hash = HASH_SEED
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * HASH_FACTOR + value.charCodeAt(index)) % HASH_MODULO
  }
  return hash
}

const NOISE_FACTOR = 12.9898
const NOISE_SCALE = 43_758.5453

/**
 * A value in [0, 1) for a given seed. Same seed, same value — always.
 *
 * The usual sine-fract trick: cheap, deterministic and irregular enough for
 * decoration. Not suitable for anything that needs real randomness.
 */
export const pseudoRandom = (seed: number): number => {
  const value = Math.sin(seed * NOISE_FACTOR) * NOISE_SCALE
  return value - Math.floor(value)
}

/** Centred variant in [-0.5, 0.5) — handy for offsets. */
export const pseudoOffset = (seed: number): number => pseudoRandom(seed) - 0.5

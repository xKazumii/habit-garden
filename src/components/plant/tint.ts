import { TRUNK_TINT_TARGET, type HealthTint } from '../../config/plant-visuals'
import { mixTo } from '../../lib/color'

/**
 * Applies a health tint to a species palette.
 *
 * Health is expressed by recolouring the palette itself rather than filtering
 * the finished picture. Foliage gives way faster than blossoms and fruit — a
 * wilting sunflower keeps a hint of yellow long after its leaves have turned.
 * Wood does not fade towards the same target; it greys.
 */

/** Leaves and stems — the first thing to go. */
const FOLIAGE_KEYS = ['leaf', 'leafLight'] as const
/** Blossoms, centres and fruit hold their colour longer. */
const BLOOM_KEYS = ['bloom', 'center', 'fruit'] as const
const TRUNK_KEY = 'trunk'

export const tintVisual = <T extends object>(visual: T, tint: HealthTint | null): T => {
  if (!tint) return visual

  const tinted = { ...visual } as unknown as Record<string, unknown>

  for (const key of FOLIAGE_KEYS) {
    const value = tinted[key]
    if (typeof value === 'string') tinted[key] = mixTo(value, tint.target, tint.foliage)
  }

  for (const key of BLOOM_KEYS) {
    const value = tinted[key]
    if (typeof value === 'string') tinted[key] = mixTo(value, tint.target, tint.bloom)
  }

  const trunk = tinted[TRUNK_KEY]
  if (typeof trunk === 'string') {
    tinted[TRUNK_KEY] = mixTo(trunk, TRUNK_TINT_TARGET, tint.bloom)
  }

  return tinted as T
}

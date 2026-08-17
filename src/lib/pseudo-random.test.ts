import { describe, expect, it } from 'vitest'

import { hashString, pseudoOffset, pseudoRandom } from './pseudo-random'

describe('hashString', () => {
  it('is stable for the same input', () => {
    expect(hashString('lavender')).toBe(hashString('lavender'))
  })

  it('separates the species we actually ship', () => {
    // A collision would make two species look identical — worth asserting.
    const ids = [
      'parsley',
      'mint',
      'basil',
      'chives',
      'oregano',
      'thyme',
      'sage',
      'lemonbalm',
      'rosemary',
      'lavender',
      'daisy',
      'sunflower',
      'marigold',
      'cornflower',
      'forgetmenot',
      'poppy',
      'cosmos',
      'crocus',
      'tulip',
      'dahlia',
      'oak',
      'birch',
      'pine',
      'maple',
      'apple',
      'fig',
      'olive',
      'lemon',
      'cherry',
      'ginkgo',
    ]

    expect(new Set(ids.map(hashString)).size).toBe(ids.length)
  })

  it('stays within the modulo', () => {
    expect(hashString('a-very-long-species-identifier')).toBeLessThan(99_991)
    expect(hashString('')).toBeGreaterThanOrEqual(0)
  })
})

describe('pseudoRandom', () => {
  it('is stable for the same seed', () => {
    expect(pseudoRandom(1234)).toBe(pseudoRandom(1234))
  })

  it('stays inside [0, 1)', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const value = pseudoRandom(seed)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('spreads across the range rather than clustering', () => {
    const values = Array.from({ length: 200 }, (_unused, seed) => pseudoRandom(seed))
    const low = values.filter((value) => value < 0.5).length

    // A degenerate generator would land everything on one side.
    expect(low).toBeGreaterThan(60)
    expect(low).toBeLessThan(140)
  })
})

describe('pseudoOffset', () => {
  it('stays inside [-0.5, 0.5)', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const value = pseudoOffset(seed)
      expect(value).toBeGreaterThanOrEqual(-0.5)
      expect(value).toBeLessThan(0.5)
    }
  })
})

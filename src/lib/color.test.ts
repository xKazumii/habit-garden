import { describe, expect, it } from 'vitest'

import { isHexColor, mix, mixTo } from './color'

describe('isHexColor', () => {
  it('accepts a six-digit hex colour', () => {
    expect(isHexColor('#6E9A6B')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isHexColor('#abc')).toBe(false)
    expect(isHexColor('rgb(1,2,3)')).toBe(false)
    expect(isHexColor('var(--hg-soil)')).toBe(false)
    expect(isHexColor(42)).toBe(false)
  })
})

describe('mix', () => {
  it('returns the colour unchanged at 0', () => {
    expect(mix('#6E9A6B', 0)).toBe('#6e9a6b')
  })

  it('lightens towards white for a positive amount', () => {
    expect(mix('#000000', 0.5)).toBe('#808080')
    expect(mix('#000000', 1)).toBe('#ffffff')
  })

  it('darkens towards black for a negative amount', () => {
    expect(mix('#ffffff', -0.5)).toBe('#808080')
    expect(mix('#ffffff', -1)).toBe('#000000')
  })

  it('clamps amounts beyond the range', () => {
    expect(mix('#000000', 4)).toBe('#ffffff')
    expect(mix('#ffffff', -4)).toBe('#000000')
  })

  it('passes non-hex values straight through', () => {
    // Call sites paint CSS variables too — those must not be mangled.
    expect(mix('var(--hg-soil)', -0.4)).toBe('var(--hg-soil)')
  })
})

describe('mixTo', () => {
  it('returns the colour unchanged at 0', () => {
    expect(mixTo('#6E9A6B', '#8B6636', 0)).toBe('#6e9a6b')
  })

  it('reaches the target at 1', () => {
    expect(mixTo('#6E9A6B', '#8B6636', 1)).toBe('#8b6636')
  })

  it('lands halfway at 0.5', () => {
    expect(mixTo('#000000', '#ffffff', 0.5)).toBe('#808080')
  })

  it('clamps amounts outside the range', () => {
    expect(mixTo('#000000', '#ffffff', 2)).toBe('#ffffff')
    expect(mixTo('#000000', '#ffffff', -2)).toBe('#000000')
  })

  it('passes non-hex values straight through', () => {
    expect(mixTo('var(--hg-soil)', '#8B6636', 0.5)).toBe('var(--hg-soil)')
  })
})

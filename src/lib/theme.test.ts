import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  DARK_MEDIA_QUERY,
  DEFAULT_THEME_PREFERENCE,
  THEME_COLOR,
  THEME_STORAGE_KEY,
} from '../config/theme'
import { isThemePreference, resolveTheme, toThemePreference } from './theme'

describe('resolveTheme', () => {
  it('follows the device setting for "system"', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('overrides the device setting for a fixed choice', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})

describe('toThemePreference', () => {
  it('accepts every valid value', () => {
    expect(toThemePreference('system')).toBe('system')
    expect(toThemePreference('light')).toBe('light')
    expect(toThemePreference('dark')).toBe('dark')
  })

  it('falls back to the default for anything else', () => {
    expect(toThemePreference(null)).toBe(DEFAULT_THEME_PREFERENCE)
    expect(toThemePreference('sepia')).toBe(DEFAULT_THEME_PREFERENCE)
    expect(toThemePreference(42)).toBe(DEFAULT_THEME_PREFERENCE)
  })

  it('recognises valid preferences as such', () => {
    expect(isThemePreference('dark')).toBe(true)
    expect(isThemePreference('sepia')).toBe(false)
  })
})

/*
 * The inline script in index.html has to run before the bundle and therefore
 * cannot import anything — it duplicates the storage key, the media query and the
 * two theme colours. These tests keep both places in sync.
 */
describe('inline script in index.html', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')

  it('uses the same storage key as the configuration', () => {
    expect(html).toContain(THEME_STORAGE_KEY)
  })

  it('uses the same media query', () => {
    expect(html).toContain(DARK_MEDIA_QUERY)
  })

  it('knows both theme colours', () => {
    expect(html).toContain(THEME_COLOR.light)
    expect(html).toContain(THEME_COLOR.dark)
  })

  it('sets the attribute the palette listens to', () => {
    expect(html).toContain('data-theme')
  })

  it('runs before the module script, otherwise it flickers', () => {
    expect(html.indexOf(THEME_STORAGE_KEY)).toBeLessThan(html.indexOf('src/main.tsx'))
  })
})

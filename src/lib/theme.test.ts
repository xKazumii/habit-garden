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
  it('folgt bei „System" der Geräteeinstellung', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('überstimmt die Geräteeinstellung bei fester Wahl', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})

describe('toThemePreference', () => {
  it('nimmt alle gültigen Werte an', () => {
    expect(toThemePreference('system')).toBe('system')
    expect(toThemePreference('light')).toBe('light')
    expect(toThemePreference('dark')).toBe('dark')
  })

  it('fällt bei allem anderen auf den Standard zurück', () => {
    expect(toThemePreference(null)).toBe(DEFAULT_THEME_PREFERENCE)
    expect(toThemePreference('sepia')).toBe(DEFAULT_THEME_PREFERENCE)
    expect(toThemePreference(42)).toBe(DEFAULT_THEME_PREFERENCE)
  })

  it('erkennt gültige Präferenzen als solche', () => {
    expect(isThemePreference('dark')).toBe(true)
    expect(isThemePreference('sepia')).toBe(false)
  })
})

/*
 * Das Inline-Skript in index.html muss vor dem Bundle laufen und kann deshalb
 * nichts importieren — es dupliziert Speicherschlüssel, Media Query und die
 * beiden Theme-Farben. Diese Tests halten beide Stellen zusammen.
 */
describe('Inline-Skript in index.html', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')

  it('benutzt denselben Speicherschlüssel wie die Konfiguration', () => {
    expect(html).toContain(THEME_STORAGE_KEY)
  })

  it('benutzt dieselbe Media Query', () => {
    expect(html).toContain(DARK_MEDIA_QUERY)
  })

  it('kennt beide Theme-Farben', () => {
    expect(html).toContain(THEME_COLOR.light)
    expect(html).toContain(THEME_COLOR.dark)
  })

  it('setzt das Attribut, auf das die Palette hört', () => {
    expect(html).toContain('data-theme')
  })

  it('läuft vor dem Modul-Skript, sonst flackert es', () => {
    expect(html.indexOf(THEME_STORAGE_KEY)).toBeLessThan(html.indexOf('src/main.tsx'))
  })
})

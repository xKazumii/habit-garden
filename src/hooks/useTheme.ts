import { useCallback, useEffect, useState } from 'react'

import {
  DARK_MEDIA_QUERY,
  DEFAULT_THEME_PREFERENCE,
  THEME_ATTRIBUTE,
  THEME_COLOR,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from '../config/theme'
import { resolveTheme, toThemePreference } from '../lib/theme'

/**
 * Theme-Steuerung: liest die Präferenz aus localStorage, hört auf die
 * Systemeinstellung und schreibt das Ergebnis auf `<html>`.
 *
 * Das Attribut steht beim ersten Paint bereits — gesetzt vom Inline-Skript in
 * index.html. Dieser Hook übernimmt danach und hält es aktuell.
 *
 * localStorage kann werfen (Safari im privaten Modus). Beide Zugriffe sind
 * deshalb abgesichert; im Zweifel gilt „System".
 */

const readPreference = (): ThemePreference => {
  try {
    return toThemePreference(localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return DEFAULT_THEME_PREFERENCE
  }
}

const writePreference = (preference: ThemePreference): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    /* Ohne Speicher gilt die Wahl nur für diese Sitzung. */
  }
}

const prefersDark = (): boolean => window.matchMedia(DARK_MEDIA_QUERY).matches

export interface ThemeControl {
  preference: ThemePreference
  resolved: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

export const useTheme = (): ThemeControl => {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference)
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(prefersDark)

  // Nur relevant, solange „System" gewählt ist — der Listener kostet aber nichts.
  useEffect(() => {
    const query = window.matchMedia(DARK_MEDIA_QUERY)
    const onChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches)

    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const resolved = resolveTheme(preference, systemPrefersDark)

  useEffect(() => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, resolved)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLOR[resolved])
  }, [resolved])

  const setPreference = useCallback((next: ThemePreference) => {
    writePreference(next)
    setPreferenceState(next)
  }, [])

  return { preference, resolved, setPreference }
}

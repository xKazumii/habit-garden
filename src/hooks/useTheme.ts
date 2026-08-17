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
 * Theme control: reads the preference from localStorage, listens to the system
 * setting and writes the result onto `<html>`.
 *
 * The attribute is already in place at first paint — set by the inline script in
 * index.html. This hook takes over afterwards and keeps it current.
 *
 * localStorage can throw (Safari in private mode). Both accesses are guarded; in
 * doubt "system" applies.
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
    /* Without storage the choice only holds for this session. */
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

  // Only relevant while "system" is selected, but the listener costs nothing.
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

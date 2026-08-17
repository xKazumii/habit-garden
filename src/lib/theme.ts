import {
  DEFAULT_THEME_PREFERENCE,
  THEME_PREFERENCES,
  type ResolvedTheme,
  type ThemePreference,
} from '../config/theme'

/**
 * Auflösung der Theme-Präferenz. Rein und ohne DOM-Bezug — der Zugriff auf
 * localStorage und `matchMedia` liegt in src/hooks/useTheme.ts.
 */

export const isThemePreference = (value: unknown): value is ThemePreference =>
  typeof value === 'string' && THEME_PREFERENCES.includes(value as ThemePreference)

/** Fällt bei allem Unbekannten auf „System" zurück, statt zu werfen. */
export const toThemePreference = (value: unknown): ThemePreference =>
  isThemePreference(value) ? value : DEFAULT_THEME_PREFERENCE

export const resolveTheme = (
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme => {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light'
  return preference
}

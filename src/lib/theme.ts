import {
  DEFAULT_THEME_PREFERENCE,
  THEME_PREFERENCES,
  type ResolvedTheme,
  type ThemePreference,
} from '../config/theme'

/**
 * Resolution of the theme preference. Pure and free of DOM ties — localStorage
 * and `matchMedia` access lives in src/hooks/useTheme.ts.
 */

export const isThemePreference = (value: unknown): value is ThemePreference =>
  typeof value === 'string' && THEME_PREFERENCES.includes(value as ThemePreference)

/** Falls back to "system" for anything unknown instead of throwing. */
export const toThemePreference = (value: unknown): ThemePreference =>
  isThemePreference(value) ? value : DEFAULT_THEME_PREFERENCE

export const resolveTheme = (
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme => {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light'
  return preference
}

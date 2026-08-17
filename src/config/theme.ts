/**
 * Dark mode.
 *
 * `data-theme` on `<html>` always carries the *resolved* value `light` or
 * `dark`, never `system` — the resolution happens in `useTheme`. That keeps the
 * CSS at exactly one dark block; the alternative would be repeating the whole
 * palette under `@media (prefers-color-scheme: dark)`.
 *
 * NOTE: the storage key and the theme colours appear a second time in the inline
 * script in index.html. That is unavoidable — the script must run before the
 * bundle and therefore cannot import anything. src/lib/theme.test.ts compares
 * both places so they cannot drift apart.
 */

export type ThemePreference = 'system' | 'light' | 'dark'

/** What ends up on `<html>`. */
export type ResolvedTheme = 'light' | 'dark'

export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark']

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system'

export const THEME_STORAGE_KEY = 'habit-garden-theme'

export const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export const THEME_ATTRIBUTE = 'data-theme'

/** Must match `--hg-canvas` in src/index.css — colours the status bar. */
export const THEME_COLOR: Readonly<Record<ResolvedTheme, string>> = {
  light: '#FAF7F2',
  dark: '#1B241E',
}

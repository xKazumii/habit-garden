/**
 * Dark Mode.
 *
 * `data-theme` auf `<html>` trägt immer den *aufgelösten* Wert `light` oder
 * `dark`, nie `system` — die Auflösung passiert in `useTheme`. Dadurch braucht
 * das CSS genau einen Dark-Block; die Alternative wäre, die komplette Palette
 * unter `@media (prefers-color-scheme: dark)` zu wiederholen.
 *
 * ACHTUNG: Speicherschlüssel und Theme-Farben stehen ein zweites Mal im
 * Inline-Skript in index.html. Das ist unvermeidbar — das Skript muss vor dem
 * Bundle laufen und kann deshalb nichts importieren. src/lib/theme.test.ts
 * vergleicht beide Stellen, damit sie nicht auseinanderlaufen.
 */

export type ThemePreference = 'system' | 'light' | 'dark'

/** Was am Ende auf `<html>` steht. */
export type ResolvedTheme = 'light' | 'dark'

export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark']

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system'

export const THEME_STORAGE_KEY = 'habit-garden-theme'

export const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export const THEME_ATTRIBUTE = 'data-theme'

/** Muss zu `--hg-canvas` in src/index.css passen — färbt die Statusleiste. */
export const THEME_COLOR: Readonly<Record<ResolvedTheme, string>> = {
  light: '#FAF7F2',
  dark: '#1B241E',
}

/**
 * The three tabs. Deliberately no router: navigation runs through state so that
 * GitHub Pages needs no SPA fallback.
 *
 * The labels live in src/i18n/de.ts under `tabs.<id>`.
 */
export type TabId = 'garden' | 'today' | 'settings'

export const TAB_ORDER: readonly TabId[] = ['garden', 'today', 'settings']

export const DEFAULT_TAB: TabId = 'garden'

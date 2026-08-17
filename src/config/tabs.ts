/**
 * Die drei Tabs. Bewusst kein Router: die Navigation läuft über State, damit
 * GitHub Pages keinen SPA-Fallback braucht.
 *
 * Die Beschriftungen stehen in src/i18n/de.ts unter `tabs.<id>`.
 */
export type TabId = 'garden' | 'today' | 'settings'

export const TAB_ORDER: readonly TabId[] = ['garden', 'today', 'settings']

export const DEFAULT_TAB: TabId = 'garden'

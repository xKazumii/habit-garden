import { useCallback, useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

/**
 * Registers the service worker and reports when a newer version is waiting.
 *
 * Why this exists at all: an installed PWA has no reload button. With the
 * plugin's injected registration script the new version is fetched on start but
 * the page keeps showing the old one — you need *two* launches before an update
 * appears. So the app has to offer the reload itself.
 *
 * Deliberately **not** reloading on its own (`registerType: 'prompt'` rather
 * than `'autoUpdate'`): a reload while someone is typing a habit name throws the
 * input away. The banner asks first.
 *
 * A standalone PWA can stay open for days without ever firing a `load` event, so
 * the registration is asked to re-check whenever the app becomes visible again —
 * the same trigger `useNow()` uses, and no timer.
 */

export interface AppUpdate {
  /** A newer version is downloaded and waiting to take over. */
  ready: boolean
  /** Activates it and reloads the page. */
  apply: () => void
}

/**
 * The service worker must only be registered once per page, and React runs
 * effects twice in development.
 */
let registered = false

export const useAppUpdate = (): AppUpdate => {
  const [ready, setReady] = useState(false)
  const applyRef = useRef<() => void>(() => undefined)

  useEffect(() => {
    if (registered) return
    registered = true

    const updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh: () => setReady(true),
      onRegisteredSW: (_scriptUrl, registration) => {
        if (!registration) return

        const check = () => {
          void registration.update().catch((error: unknown) => {
            // Offline is the normal case here, not a problem worth shouting about.
            console.debug('[pwa] update check failed', error)
          })
        }

        const checkWhenVisible = () => {
          if (document.visibilityState === 'visible') check()
        }

        document.addEventListener('visibilitychange', checkWhenVisible)
        window.addEventListener('focus', check)
      },
      onRegisterError: (error: unknown) => {
        console.error('[pwa] service worker registration failed', error)
      },
    })

    applyRef.current = () => void updateServiceWorker()
  }, [])

  const apply = useCallback(() => applyRef.current(), [])

  return { ready, apply }
}

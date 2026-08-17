import { useCallback, useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

/**
 * Registers the service worker, reports when a newer version is waiting, and
 * lets the user ask for one on demand.
 *
 * Why this exists: an installed PWA has no reload button. Two things follow from
 * that. First, the app has to offer the reload itself — hence `ready` and
 * `apply`. Second, waiting for the app to notice on its own is not enough: the
 * user needs to be able to *ask*, the way they would hit reload in a browser.
 * That is `check`.
 *
 * Deliberately **not** reloading on its own (`registerType: 'prompt'` rather
 * than `'autoUpdate'`): a reload while someone is typing a habit name throws the
 * input away.
 *
 * A standalone PWA can stay open for days without ever firing a `load` event, so
 * the registration is also re-checked whenever the app becomes visible again —
 * the same trigger `useNow()` uses, and no timer.
 */

export interface AppUpdate {
  /** A service worker is registered — false in dev and where unsupported. */
  supported: boolean
  /** A newer version is downloaded and waiting to take over. */
  ready: boolean
  /** A manual check is in flight. */
  checking: boolean
  /** The last manual check found nothing newer. */
  upToDate: boolean
  /** Activates the waiting version and reloads the page. */
  apply: () => void
  /** Asks the server whether a newer version exists. */
  check: () => void
}

/**
 * The service worker must only be registered once per page, and React runs
 * effects twice in development.
 */
let registered = false

export const useAppUpdate = (): AppUpdate => {
  const [supported, setSupported] = useState(false)
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(false)
  const [upToDate, setUpToDate] = useState(false)

  const applyRef = useRef<() => void>(() => undefined)
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (registered) return
    registered = true

    const updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh: () => {
        setReady(true)
        setUpToDate(false)
      },
      onRegisteredSW: (_scriptUrl, registration) => {
        if (!registration) return

        registrationRef.current = registration
        setSupported(true)

        const refresh = () => {
          void registration.update().catch((error: unknown) => {
            // Offline is the normal case here, not worth shouting about.
            console.debug('[pwa] update check failed', error)
          })
        }

        const refreshWhenVisible = () => {
          if (document.visibilityState === 'visible') refresh()
        }

        document.addEventListener('visibilitychange', refreshWhenVisible)
        window.addEventListener('focus', refresh)
      },
      onRegisterError: (error: unknown) => {
        console.error('[pwa] service worker registration failed', error)
      },
    })

    applyRef.current = () => void updateServiceWorker()
  }, [])

  const apply = useCallback(() => applyRef.current(), [])

  const check = useCallback(() => {
    const registration = registrationRef.current
    if (!registration) return

    setChecking(true)
    setUpToDate(false)

    void registration
      .update()
      .then(() => {
        /*
         * `update()` resolves once the check is done, but a freshly found worker
         * may still be installing — `onNeedRefresh` fires later. So only claim
         * "up to date" when nothing at all is pending.
         */
        const pending = registration.installing !== null || registration.waiting !== null
        if (!pending) setUpToDate(true)
      })
      .catch((error: unknown) => {
        console.debug('[pwa] update check failed', error)
      })
      .finally(() => setChecking(false))
  }, [])

  return { supported, ready, checking, upToDate, apply, check }
}

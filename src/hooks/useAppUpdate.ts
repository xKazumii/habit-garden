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
  /** The reload was triggered and is under way. */
  applying: boolean
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

/**
 * If the controller never changes, reload anyway.
 *
 * A fresh navigation is still better than a button that appears to do nothing —
 * and should the worker not have activated after all, the banner simply comes
 * back.
 */
const RELOAD_FALLBACK_MS = 1800

export const useAppUpdate = (): AppUpdate => {
  const [supported, setSupported] = useState(false)
  const [ready, setReady] = useState(false)
  const [applying, setApplying] = useState(false)
  const [checking, setChecking] = useState(false)
  const [upToDate, setUpToDate] = useState(false)

  const skipWaitingRef = useRef<() => void>(() => undefined)
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const applyingRef = useRef(false)

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

    skipWaitingRef.current = () => void updateServiceWorker()
  }, [])

  /**
   * The reload is ours on purpose.
   *
   * The plugin only reloads from its `controlling` handler, and only when
   * workbox flags the activation as `isUpdate` — which requires the page to have
   * been controlled by a worker with the same script URL at registration time.
   * In an installed PWA that does not hold reliably: the new worker takes over
   * and nothing reloads. `controllerchange` on the container has no such
   * condition.
   */
  const apply = useCallback(() => {
    if (applyingRef.current) return
    applyingRef.current = true
    setApplying(true)

    const reload = () => window.location.reload()

    navigator.serviceWorker?.addEventListener('controllerchange', reload, { once: true })
    window.setTimeout(reload, RELOAD_FALLBACK_MS)

    // Both routes to the same message; sending it twice is harmless.
    skipWaitingRef.current()
    registrationRef.current?.waiting?.postMessage({ type: 'SKIP_WAITING' })
  }, [])

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

  return { supported, ready, applying, checking, upToDate, apply, check }
}

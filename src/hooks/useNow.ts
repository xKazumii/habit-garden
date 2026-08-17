import { useEffect, useState } from 'react'

/**
 * The time reference the screens derive their state from.
 *
 * Deliberately **without** `setInterval`: the growth logic computes from
 * timestamps anyway, so a timer would only burn render cycles and soften the rule
 * stated in CLAUDE.md. It is re-read when the user returns to the app — exactly
 * when the calendar day may have changed.
 */
export const useNow = (): number => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const refresh = () => setNow(Date.now())
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    document.addEventListener('visibilitychange', refreshWhenVisible)
    window.addEventListener('focus', refresh)

    return () => {
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return now
}

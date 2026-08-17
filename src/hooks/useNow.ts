import { useEffect, useState } from 'react'

/**
 * Der Zeitbezug, mit dem die Screens ihre Zustände ableiten.
 *
 * Bewusst **ohne** `setInterval`: die Wachstumslogik rechnet ohnehin aus
 * Zeitstempeln, ein Timer würde nur Renderzyklen verbrennen und den Grundsatz
 * aus der CLAUDE.md aufweichen. Neu gelesen wird, wenn der Nutzer zur App
 * zurückkehrt — genau dann kann der Kalendertag gewechselt haben.
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

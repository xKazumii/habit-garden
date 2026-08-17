import { useCallback, useEffect, useState } from 'react'

import { POUR_DURATION_MS } from '../config/plant-visuals'

/**
 * Short-lived flag for the falling water droplet.
 *
 * Lives next to the watering button rather than in App: the droplet belongs to
 * the plant that was just watered, and the button already knows which one that
 * is. No prop threading, no app-level state.
 */
export const useDroplet = (): { pouring: boolean; pour: () => void } => {
  const [pouring, setPouring] = useState(false)

  const pour = useCallback(() => setPouring(true), [])

  useEffect(() => {
    if (!pouring) return

    const timer = window.setTimeout(() => setPouring(false), POUR_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [pouring])

  return { pouring, pour }
}

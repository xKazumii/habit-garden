import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'

import { t } from '../i18n'

/**
 * Bottom Sheet: verdunkelter Hintergrund, Inhalt fährt von unten auf.
 * Schließt per Tippen auf den Hintergrund, per Escape — und per Zug am Griff
 * nach unten.
 *
 * Der Zug hängt **nur** am Griff, nicht am ganzen Sheet. Der Inhalt scrollt
 * (`overflow-y-auto`); würde jede Berührung eine Zuggeste starten, käme sich
 * beides in die Quere. Der Griff bekommt dafür einen großzügigen Trefferbereich
 * und `touch-none`, damit der Browser dort nicht selbst scrollt.
 */

const ESCAPE_KEY = 'Escape'

/** Ab dieser Strecke schließt das Sheet. */
const DISMISS_DISTANCE_PX = 96
/** Ein schneller Wisch schließt auch früher — in Pixeln pro Millisekunde. */
const DISMISS_VELOCITY = 0.5

interface DragStart {
  y: number
  time: number
}

interface BottomSheetProps {
  onClose: () => void
  /** id der Überschrift im Sheet — beschriftet den Dialog. */
  labelledBy?: string
  children: ReactNode
}

export const BottomSheet = ({ onClose, labelledBy, children }: BottomSheetProps) => {
  const start = useRef<DragStart | null>(null)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  /*
   * Die Eintrittsanimation läuft mit `fill-mode: both` und würde ein inline
   * gesetztes transform überstimmen. Deshalb fliegt die Klasse raus, sobald sie
   * durch ist — der Endzustand entspricht dem natürlichen, es ruckelt nicht.
   */
  const [hasEntered, setHasEntered] = useState(false)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === ESCAPE_KEY) onClose()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    start.current = { y: event.clientY, time: event.timeStamp }
    setIsDragging(true)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return
    // Nur nach unten: nach oben soll sich das Sheet nicht dehnen lassen.
    setDragY(Math.max(0, event.clientY - start.current.y))
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return

    const distance = Math.max(0, event.clientY - start.current.y)
    const duration = event.timeStamp - start.current.time
    const velocity = duration > 0 ? distance / duration : 0

    start.current = null
    setIsDragging(false)

    if (distance > DISMISS_DISTANCE_PX || velocity > DISMISS_VELOCITY) {
      onClose()
      return
    }
    setDragY(0)
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end">
      <button
        type="button"
        aria-label={t('detail.close')}
        onClick={onClose}
        className="bg-scrim animate-enter absolute inset-0"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onAnimationEnd={(event) => {
          // Nur die eigene Animation zählt, nicht die der Kinder.
          if (event.target === event.currentTarget) setHasEntered(true)
        }}
        style={{
          transform: dragY === 0 ? undefined : `translateY(${dragY}px)`,
          transition: isDragging
            ? 'none'
            : 'transform var(--hg-duration-base) var(--hg-ease-soft)',
        }}
        className={`bg-canvas shadow-sheet rounded-t-sheet pb-safe-sheet relative max-h-[88%] overflow-y-auto px-5.5 ${
          hasEntered ? '' : 'animate-rise'
        }`}
      >
        {/*
          Reine Zeigegeste — für Tastatur und Screenreader gibt es Escape und die
          beschriftete Fläche dahinter, ein zweites Schließen-Element wäre nur
          Lärm.
        */}
        <div
          aria-hidden="true"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="flex cursor-grab touch-none justify-center pt-3 pb-2 active:cursor-grabbing"
        >
          <span className="bg-muted h-[5px] w-11 rounded-full opacity-30" />
        </div>

        {children}
      </div>
    </div>
  )
}

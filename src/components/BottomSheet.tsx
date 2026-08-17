import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'

import { t } from '../i18n'

/**
 * Bottom sheet: dimmed backdrop, content rises from below.
 * Closes on a tap outside, on Escape — and on dragging the handle down.
 *
 * The drag is bound **only** to the handle, not to the whole sheet. The content
 * scrolls (`overflow-y-auto`); if every touch started a drag the two gestures
 * would fight each other. The handle therefore gets a generous hit area and
 * `touch-none` so the browser does not scroll there itself.
 */

const ESCAPE_KEY = 'Escape'

/** Past this distance the sheet closes. */
const DISMISS_DISTANCE_PX = 96
/** A quick flick closes earlier too — in pixels per millisecond. */
const DISMISS_VELOCITY = 0.5

interface DragStart {
  y: number
  time: number
}

interface BottomSheetProps {
  onClose: () => void
  /** id of the heading inside the sheet — labels the dialog. */
  labelledBy?: string
  children: ReactNode
}

export const BottomSheet = ({ onClose, labelledBy, children }: BottomSheetProps) => {
  const start = useRef<DragStart | null>(null)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  /*
   * The entry animation runs with `fill-mode: both` and would override an inline
   * transform. The class is therefore dropped once it has finished — its end
   * state equals the natural one, so nothing jumps.
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
    // Downwards only: the sheet must not stretch upwards.
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
          // Only our own animation counts, not the children's.
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
          Pointer gesture only — keyboard and screen readers have Escape and the
          labelled backdrop, so a second close control would just be noise.
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

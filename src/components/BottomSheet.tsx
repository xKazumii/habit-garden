import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'

import { t } from '../i18n'

/**
 * Bottom sheet: dimmed backdrop, content rises from below.
 * Closes on a tap outside, on Escape, and on dragging it down.
 *
 * The drag works **anywhere on the card**, which takes some care because the
 * card is also the scroll container. Two rules keep the gestures apart:
 *
 *  - a drag only starts when the content is scrolled to the very top and the
 *    finger moves *down*. Anywhere below the top, a downward move scrolls.
 *  - the grab handle always drags, whatever the scroll position — it is the one
 *    affordance that promises exactly this.
 *
 * Cancelling the native scroll needs a non-passive `touchmove` listener:
 * `preventDefault()` on a pointer event does not stop a scroll the browser has
 * already begun.
 */

const ESCAPE_KEY = 'Escape'

/** Past this distance the sheet closes. */
const DISMISS_DISTANCE_PX = 96
/** A quick flick closes earlier too — in pixels per millisecond. */
const DISMISS_VELOCITY = 0.5
/** Movement before a touch counts as a drag rather than a tap. */
const DRAG_START_THRESHOLD_PX = 6
/** Subpixel scroll offsets should still count as "at the top". */
const SCROLL_TOP_TOLERANCE_PX = 1

const HANDLE_ATTRIBUTE = 'data-sheet-handle'

interface DragStart {
  y: number
  time: number
  scrollTop: number
  fromHandle: boolean
}

interface BottomSheetProps {
  onClose: () => void
  /** id of the heading inside the sheet — labels the dialog. */
  labelledBy?: string
  children: ReactNode
}

export const BottomSheet = ({ onClose, labelledBy, children }: BottomSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null)
  const start = useRef<DragStart | null>(null)
  /* Mirrors `isDragging` for the touchmove listener, which sees no re-renders. */
  const dragging = useRef(false)

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

  useEffect(() => {
    const element = sheetRef.current
    if (!element) return

    // Only reachable as a non-passive listener, so React's onTouchMove is out.
    const blockNativeScroll = (event: TouchEvent) => {
      if (dragging.current) event.preventDefault()
    }

    element.addEventListener('touchmove', blockNativeScroll, { passive: false })
    return () => element.removeEventListener('touchmove', blockNativeScroll)
  }, [])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null

    start.current = {
      y: event.clientY,
      time: event.timeStamp,
      scrollTop: sheetRef.current?.scrollTop ?? 0,
      fromHandle: target?.closest(`[${HANDLE_ATTRIBUTE}]`) !== null && target !== null,
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const from = start.current
    if (!from) return

    const delta = event.clientY - from.y

    if (!dragging.current) {
      const atTop = from.scrollTop <= SCROLL_TOP_TOLERANCE_PX
      if (!from.fromHandle && !atTop) return
      if (delta < DRAG_START_THRESHOLD_PX) return

      dragging.current = true
      setIsDragging(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    }

    // Downwards only: the sheet must not stretch upwards.
    setDragY(Math.max(0, delta))
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const from = start.current
    start.current = null

    if (!from || !dragging.current) return
    dragging.current = false
    setIsDragging(false)

    const distance = Math.max(0, event.clientY - from.y)
    const duration = event.timeStamp - from.time
    const velocity = duration > 0 ? distance / duration : 0

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
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onAnimationEnd={(event) => {
          // Only our own animation counts, not the children's.
          if (event.target === event.currentTarget) setHasEntered(true)
        }}
        style={{
          transform: dragY === 0 ? undefined : `translateY(${dragY}px)`,
          transition: isDragging
            ? 'none'
            : 'transform var(--hg-duration-base) var(--hg-ease-soft)',
          userSelect: isDragging ? 'none' : undefined,
        }}
        className={`bg-canvas shadow-sheet rounded-t-sheet pb-safe-sheet relative max-h-[88%] overflow-y-auto overscroll-contain px-5.5 ${
          hasEntered ? '' : 'animate-rise'
        }`}
      >
        {/*
          Decorative: the drag lives on the whole card. Keyboard and screen
          readers have Escape and the labelled backdrop.
        */}
        <div
          aria-hidden="true"
          {...{ [HANDLE_ATTRIBUTE]: true }}
          className="flex cursor-grab touch-none justify-center pt-3 pb-2 active:cursor-grabbing"
        >
          <span className="bg-muted h-[5px] w-11 rounded-full opacity-30" />
        </div>

        {children}
      </div>
    </div>
  )
}

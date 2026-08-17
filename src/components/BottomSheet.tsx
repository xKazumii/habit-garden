import { useEffect, type ReactNode } from 'react'

import { t } from '../i18n'

/**
 * Bottom Sheet: verdunkelter Hintergrund, Inhalt fährt von unten auf.
 * Schließt per Tippen auf den Hintergrund und per Escape.
 */

const ESCAPE_KEY = 'Escape'

interface BottomSheetProps {
  onClose: () => void
  /** id der Überschrift im Sheet — beschriftet den Dialog. */
  labelledBy?: string
  children: ReactNode
}

export const BottomSheet = ({ onClose, labelledBy, children }: BottomSheetProps) => {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === ESCAPE_KEY) onClose()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

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
        className="bg-canvas shadow-sheet animate-rise rounded-t-sheet pb-safe-sheet relative max-h-[88%] overflow-y-auto px-5.5 pt-3"
      >
        <div className="bg-muted mx-auto mb-1.5 h-[5px] w-11 rounded-full opacity-30" />
        {children}
      </div>
    </div>
  )
}

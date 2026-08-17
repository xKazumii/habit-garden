import type { ReactNode } from 'react'

/**
 * Secondary action, always used in pairs side by side (edit / uproot,
 * keep / remove).
 *
 * `danger` is terracotta rather than red — the palette has no red, and the accent
 * carries enough gravity here.
 */

type ButtonTone = 'neutral' | 'danger'

const TONE_CLASS: Readonly<Record<ButtonTone, string>> = {
  neutral: 'bg-bed text-muted font-medium',
  danger: 'bg-accent text-on-accent shadow-accent font-semibold',
}

interface SecondaryButtonProps {
  children: ReactNode
  onClick: () => void
  tone?: ButtonTone
}

export const SecondaryButton = ({ children, onClick, tone = 'neutral' }: SecondaryButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 rounded-md py-[13px] text-[13px] transition duration-200 ${TONE_CLASS[tone]}`}
  >
    {children}
  </button>
)

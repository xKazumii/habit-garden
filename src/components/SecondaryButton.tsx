import type { ReactNode } from 'react'

/**
 * Nebenaktion, immer paarweise nebeneinander verwendet (Bearbeiten /
 * Ausgraben, Behalten / Entfernen).
 *
 * `danger` ist Terrakotta statt Rot — die Palette kennt kein Rot, und der
 * Akzent trägt hier genug Ernst.
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

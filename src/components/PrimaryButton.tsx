import type { ReactNode } from 'react'

/**
 * Der große Aktionsbutton am Fuß eines Flows oder Sheets.
 * Deaktiviert wird er nicht ausgegraut, sondern nimmt die Inaktiv-Fläche an —
 * das liest sich ruhiger als eine halbdurchsichtige Version.
 */

interface PrimaryButtonProps {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
}

export const PrimaryButton = ({
  children,
  onClick,
  disabled = false,
  className,
}: PrimaryButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`w-full rounded-lg py-[17px] text-[15px] font-semibold transition duration-250 ${
      disabled ? 'bg-inert text-muted' : 'bg-primary text-on-primary shadow-primary'
    } ${className ?? ''}`}
  >
    {children}
  </button>
)

import type { ReactNode } from 'react'

/**
 * The large action button at the foot of a flow or sheet.
 * When disabled it is not greyed out but takes on the inactive surface — that
 * reads calmer than a semi-transparent version.
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

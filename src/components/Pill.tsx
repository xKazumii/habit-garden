import type { ReactNode } from 'react'

/**
 * Selection chip. Used for rhythms — selected means filled, not outlined.
 */

interface PillProps {
  selected: boolean
  onClick: () => void
  children: ReactNode
}

export const Pill = ({ selected, onClick, children }: PillProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`rounded-sm px-3.5 py-2.5 text-[13px] transition duration-200 ${
      selected
        ? 'bg-primary text-on-primary shadow-primary font-semibold'
        : 'bg-surface text-muted shadow-card font-normal'
    }`}
  >
    {children}
  </button>
)

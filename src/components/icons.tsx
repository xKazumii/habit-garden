import type { ReactNode } from 'react'

/**
 * Die Icons der App. Durchgehend Linien-Icons auf 24er-Raster, Farbe immer
 * `currentColor` — die Umgebung bestimmt sie, nie das Icon selbst.
 *
 * Rein dekorativ: die Bedeutung steht immer im Label des umgebenden Elements.
 */

const VIEWBOX = '0 0 24 24'
const DEFAULT_SIZE = 22

/** Linienstärken nach Verwendungszweck, damit die Icons zusammen ruhig wirken. */
const STROKE_TAB = 1.6
const STROKE_DROP = 1.7
const STROKE_ACTION = 1.8
const STROKE_UI = 2

export interface IconProps {
  size?: number
  className?: string
}

interface StrokeIconProps extends IconProps {
  strokeWidth: number
  children: ReactNode
}

const StrokeIcon = ({ size = DEFAULT_SIZE, strokeWidth, className, children }: StrokeIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox={VIEWBOX}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    {children}
  </svg>
)

export const SproutIcon = (props: IconProps) => (
  <StrokeIcon {...props} strokeWidth={STROKE_TAB}>
    <path d="M12 21v-7" />
    <path d="M12 14c-3.6 0-5.6-2.2-5.6-5.2C9.4 8.8 12 10.5 12 14Z" />
    <path d="M12 14c0-3.5 2.6-5.2 5.6-5.2 0 3-2 5.2-5.6 5.2Z" />
    <path d="M12 13c-1.4-1.6-1.6-4 0-6.5 1.6 2.5 1.4 4.9 0 6.5Z" />
  </StrokeIcon>
)

export const CalendarCheckIcon = (props: IconProps) => (
  <StrokeIcon {...props} strokeWidth={STROKE_TAB}>
    <rect x="3.5" y="5" width="17" height="15" rx="4" />
    <path d="M8 3.5v3M16 3.5v3M8.5 13.5l2.2 2.2 4.3-4.3" />
  </StrokeIcon>
)

export const GearIcon = (props: IconProps) => (
  <StrokeIcon {...props} strokeWidth={STROKE_TAB}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3.6v2.2M12 18.2v2.2M4.6 12H6.8M17.2 12h2.2M6.8 6.8l1.6 1.6M15.6 15.6l1.6 1.6M17.2 6.8l-1.6 1.6M8.4 15.6l-1.6 1.6" />
  </StrokeIcon>
)

export const WaterDropIcon = (props: IconProps) => (
  <StrokeIcon {...props} strokeWidth={STROKE_DROP}>
    <path d="M12 3.5c3.4 4 5.5 6.6 5.5 9.3A5.5 5.5 0 0 1 12 18.3a5.5 5.5 0 0 1-5.5-5.5c0-2.7 2.1-5.3 5.5-9.3Z" />
  </StrokeIcon>
)

export const PlusIcon = (props: IconProps) => (
  <StrokeIcon {...props} strokeWidth={STROKE_ACTION}>
    <path d="M12 5v14M5 12h14" />
  </StrokeIcon>
)

export const CheckIcon = (props: IconProps) => (
  <StrokeIcon {...props} strokeWidth={STROKE_UI}>
    <path d="M5 13l4 4L19 7" />
  </StrokeIcon>
)

export const ChevronDownIcon = (props: IconProps) => (
  <StrokeIcon {...props} strokeWidth={STROKE_UI}>
    <path d="M6 9l6 6 6-6" />
  </StrokeIcon>
)

export const ChevronLeftIcon = (props: IconProps) => (
  <StrokeIcon {...props} strokeWidth={STROKE_UI}>
    <path d="M15 6l-6 6 6 6" />
  </StrokeIcon>
)

export const CloseIcon = (props: IconProps) => (
  <StrokeIcon {...props} strokeWidth={STROKE_UI}>
    <path d="M6 6l12 12M18 6L6 18" />
  </StrokeIcon>
)

export const DownloadIcon = (props: IconProps) => (
  <StrokeIcon {...props} strokeWidth={STROKE_ACTION}>
    <path d="M12 4v10M8.4 10.6 12 14.2l3.6-3.6" />
    <path d="M5 16.5v1.2a2.3 2.3 0 0 0 2.3 2.3h9.4a2.3 2.3 0 0 0 2.3-2.3v-1.2" />
  </StrokeIcon>
)

export const UploadIcon = (props: IconProps) => (
  <StrokeIcon {...props} strokeWidth={STROKE_ACTION}>
    <path d="M12 14.2V4M8.4 7.6 12 4l3.6 3.6" />
    <path d="M5 16.5v1.2a2.3 2.3 0 0 0 2.3 2.3h9.4a2.3 2.3 0 0 0 2.3-2.3v-1.2" />
  </StrokeIcon>
)

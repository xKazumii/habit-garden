/**
 * Ein Blatt: eine gekippte Ellipse, die vom Stängel wegzeigt.
 * Gemeinsame Grundform aller drei Kategorien.
 */

/** Wie weit das Blatt vom Ansatzpunkt wegrückt, relativ zu seiner Größe. */
const OFFSET_RATIO = 0.85
/** Höhe zu Breite. Flach genug, dass es wie ein Blatt liest, nicht wie ein Ball. */
const HEIGHT_RATIO = 0.44
/** Neigung nach außen, in Grad. */
const TILT = 24

export type LeafDirection = -1 | 1

interface LeafProps {
  /** Ansatzpunkt am Stängel. */
  x: number
  y: number
  /** -1 zeigt nach links, 1 nach rechts. */
  direction: LeafDirection
  size: number
  color: string
}

export const Leaf = ({ x, y, direction, size, color }: LeafProps) => {
  const cx = x + direction * size * OFFSET_RATIO

  return (
    <ellipse
      cx={cx}
      cy={y}
      rx={size}
      ry={size * HEIGHT_RATIO}
      fill={color}
      transform={`rotate(${direction * TILT} ${cx} ${y})`}
    />
  )
}

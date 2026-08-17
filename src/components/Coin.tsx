import {
  COIN_COLOR,
  COIN_EMBLEM,
  COIN_GEOMETRY,
  COIN_SIZE,
  COIN_STACK,
  COIN_VIEWBOX,
} from '../config/coin'

/**
 * The coin. Purely decorative — the amount is always stated by the text next to
 * it.
 *
 * `stack` shows three coins on top of each other, `spinning` spins it as a
 * reward. All dimensions are relative to the radius so it works at 20px as well
 * as at 84.
 */

const CENTER = 50
const FULL_RADIUS = 32

interface FaceProps {
  cx: number
  cy: number
  r: number
  emblem: boolean
}

const Face = ({ cx, cy, r, emblem }: FaceProps) => (
  <>
    <ellipse
      cx={cx}
      cy={cy + r * COIN_GEOMETRY.shadowOffset}
      rx={r * COIN_GEOMETRY.shadowRadiusX}
      ry={r * COIN_GEOMETRY.shadowRadiusY}
      fill={COIN_COLOR.shadow}
    />

    {/* The lower disc peeks out and gives the coin its thickness. */}
    <circle
      cx={cx}
      cy={cy + r * COIN_GEOMETRY.rimOffset}
      r={r}
      fill={COIN_COLOR.rim}
      stroke={COIN_COLOR.ink}
      strokeWidth={r * COIN_GEOMETRY.strokeWidth}
    />
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={COIN_COLOR.face}
      stroke={COIN_COLOR.ink}
      strokeWidth={r * COIN_GEOMETRY.strokeWidth}
    />
    <circle
      cx={cx}
      cy={cy}
      r={r * COIN_GEOMETRY.ringRadius}
      fill="none"
      stroke={COIN_COLOR.ring}
      strokeWidth={r * COIN_GEOMETRY.ringWidth}
    />

    <path
      d={`M${cx - r * 0.52} ${cy - r * 0.34} A ${r * 0.66} ${r * 0.66} 0 0 1 ${cx + r * 0.1} ${cy - r * 0.62}`}
      fill="none"
      stroke={COIN_COLOR.sheen}
      strokeWidth={r * COIN_GEOMETRY.sheenWidth}
      strokeLinecap="round"
      opacity={COIN_GEOMETRY.sheenOpacity}
    />

    {emblem && (
      <>
        <path
          d={`M${cx} ${cy + r * COIN_EMBLEM.stemBottom} Q${cx - r * COIN_EMBLEM.stemBow} ${cy} ${cx} ${cy - r * COIN_EMBLEM.stemTop}`}
          fill="none"
          stroke={COIN_COLOR.ink}
          strokeWidth={r * COIN_EMBLEM.stemWidth}
          strokeLinecap="round"
          opacity={COIN_EMBLEM.stemOpacity}
        />
        <ellipse
          cx={cx - r * COIN_EMBLEM.leafOffsetX}
          cy={cy + r * COIN_EMBLEM.leftLeafY}
          rx={r * COIN_EMBLEM.leafRadiusX}
          ry={r * COIN_EMBLEM.leafRadiusY}
          fill={COIN_COLOR.emblem}
          transform={`rotate(${-COIN_EMBLEM.leafTilt} ${cx - r * COIN_EMBLEM.leafOffsetX} ${cy + r * COIN_EMBLEM.leftLeafY})`}
        />
        <ellipse
          cx={cx + r * COIN_EMBLEM.leafOffsetX}
          cy={cy + r * COIN_EMBLEM.rightLeafY}
          rx={r * COIN_EMBLEM.leafRadiusX}
          ry={r * COIN_EMBLEM.leafRadiusY}
          fill={COIN_COLOR.emblem}
          transform={`rotate(${COIN_EMBLEM.leafTilt} ${cx + r * COIN_EMBLEM.leafOffsetX} ${cy + r * COIN_EMBLEM.rightLeafY})`}
        />
        <circle
          cx={cx}
          cy={cy - r * COIN_EMBLEM.budY}
          r={r * COIN_EMBLEM.budRadius}
          fill={COIN_COLOR.emblem}
        />
      </>
    )}
  </>
)

interface CoinProps {
  size?: number
  variant?: 'single' | 'stack'
  /** Spins — for the moment when there is something to celebrate. */
  spinning?: boolean
  className?: string
}

export const Coin = ({
  size = COIN_SIZE.chip,
  variant = 'single',
  spinning = false,
  className,
}: CoinProps) => (
  <svg
    viewBox={COIN_VIEWBOX}
    width={size}
    height={size}
    aria-hidden="true"
    focusable="false"
    className={[spinning ? 'animate-flip' : undefined, className].filter(Boolean).join(' ')}
    style={{ overflow: 'visible', display: 'block' }}
  >
    {variant === 'stack' ? (
      COIN_STACK.map((coin) => (
        <Face
          key={`${coin.x}:${coin.y}`}
          cx={CENTER + coin.x * 100}
          cy={CENTER + coin.y * 100}
          r={coin.radius * 100}
          emblem={coin.emblem}
        />
      ))
    ) : (
      <Face cx={CENTER} cy={CENTER} r={FULL_RADIUS} emblem />
    )}
  </svg>
)

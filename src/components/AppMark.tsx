/**
 * The app mark: a sprout in the bed, bud in terracotta.
 * Identical to the PWA icon (see scripts/generate-icons.mjs) so the home screen
 * and the app show the same sign.
 */

interface AppMarkProps {
  className?: string
}

export const AppMark = ({ className }: AppMarkProps) => (
  <svg viewBox="0 0 512 512" role="presentation" className={className}>
    <rect width="512" height="512" rx="96" fill="#7C9885" />
    <ellipse cx="256" cy="404" rx="132" ry="34" fill="#5F7A69" />
    <path d="M124 404 Q256 320 388 404 Z" fill="#4E6656" />
    <path
      d="M256 396 Q256 268 256 208"
      stroke="#FAF7F2"
      strokeWidth="16"
      strokeLinecap="round"
      fill="none"
    />
    <ellipse cx="200" cy="288" rx="58" ry="26" fill="#FAF7F2" transform="rotate(-20 200 288)" />
    <ellipse cx="312" cy="266" rx="58" ry="26" fill="#EFE9DF" transform="rotate(20 312 266)" />
    <circle cx="256" cy="180" r="34" fill="#D08C60" />
  </svg>
)

/**
 * Colour arithmetic for the plant illustration.
 *
 * The species palette holds one base colour per part; every outline, highlight
 * and shade is derived from it. That keeps a new species down to a handful of
 * hex values instead of a dozen.
 *
 * Pure, free of UI ties.
 */

const HEX_LENGTH = 6
const HEX_RADIX = 16
const CHANNEL_MAX = 255

type Channels = [number, number, number]

const clampChannel = (value: number): number =>
  Math.min(CHANNEL_MAX, Math.max(0, Math.round(value)))

const toChannels = (hex: string): Channels => {
  const body = hex.replace('#', '')
  return [
    Number.parseInt(body.slice(0, 2), HEX_RADIX),
    Number.parseInt(body.slice(2, 4), HEX_RADIX),
    Number.parseInt(body.slice(4, 6), HEX_RADIX),
  ]
}

const toHex = (channels: Channels): string =>
  `#${channels.map((value) => clampChannel(value).toString(HEX_RADIX).padStart(2, '0')).join('')}`

export const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('#') && value.length === HEX_LENGTH + 1

/**
 * Lightens (`amount` > 0, towards white) or darkens (`amount` < 0, towards
 * black). `amount` is a share between -1 and 1.
 *
 * Returns the input unchanged when it is not a plain hex colour — that keeps
 * call sites free of guards.
 */
export const mix = (hex: string, amount: number): string => {
  if (!isHexColor(hex)) return hex

  const target = amount > 0 ? CHANNEL_MAX : 0
  const share = Math.min(1, Math.abs(amount))

  const channels = toChannels(hex).map(
    (value) => value + (target - value) * share,
  ) as Channels

  return toHex(channels)
}

/** Blends `hex` towards `target` by `amount` (0 = unchanged, 1 = target). */
export const mixTo = (hex: string, target: string, amount: number): string => {
  if (!isHexColor(hex) || !isHexColor(target)) return hex

  const from = toChannels(hex)
  const to = toChannels(target)
  const share = Math.min(1, Math.max(0, amount))

  const channels = from.map((value, index) => {
    const other = to[index] ?? value
    return value + (other - value) * share
  }) as Channels

  return toHex(channels)
}

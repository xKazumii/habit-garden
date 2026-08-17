import type { ReactElement } from 'react'

import { isHexColor, mix } from '../../lib/color'

/**
 * Turns every flat colour into a subtle vertical gradient, so leaves and crowns
 * read as volumes rather than cut-outs.
 *
 * The gradients have to sit in `<defs>` inside the same SVG, which means the
 * parent must already know which colours occur when it renders them. React
 * renders children *after* the parent, so this cannot work with child
 * components — it is why the three plant bodies are drawing functions that run
 * synchronously and register their colours on the way.
 *
 * Registering is idempotent: the same colour always yields the same gradient.
 */

/** Light at the top, base colour in the middle, shaded at the bottom. */
const LIGHTEN = 0.16
const DARKEN = -0.3
const MIDPOINT = '52%'
const DIRECTION = { x1: '0', y1: '0', x2: '0.35', y2: '1' } as const

export interface PaintRegistry {
  /** A gradient url for a hex colour, or the value unchanged. */
  fill: (color: string) => string
  /** Every gradient registered so far. Read after the body has been drawn. */
  defs: () => ReactElement[]
}

/**
 * @param prefix unique per rendered plant — gradient ids are global in a document
 * @param enabled off for small renderings, where a gradient is invisible anyway
 */
export const createPaintRegistry = (prefix: string, enabled: boolean): PaintRegistry => {
  const ids = new Map<string, string>()

  const fill = (color: string): string => {
    if (!enabled || !isHexColor(color)) return color

    const known = ids.get(color)
    if (known !== undefined) return `url(#${known})`

    const id = `${prefix}-${ids.size}`
    ids.set(color, id)
    return `url(#${id})`
  }

  const defs = (): ReactElement[] =>
    [...ids].map(([color, id]) => (
      <linearGradient key={id} id={id} {...DIRECTION}>
        <stop offset="0%" stopColor={mix(color, LIGHTEN)} />
        <stop offset={MIDPOINT} stopColor={color} />
        <stop offset="100%" stopColor={mix(color, DARKEN)} />
      </linearGradient>
    ))

  return { fill, defs }
}

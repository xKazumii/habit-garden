import type { ReactElement } from 'react'

import { mix } from '../../lib/color'
import type { SeedShape } from '../../config/species'
import type { PaintRegistry } from './paint'

/**
 * The fourteen seed shapes shown at stage 0 — and again as an empty husk beside
 * a stage-1 tree or bulb.
 *
 * Deliberately independent of the species palette: a seed is brown, whatever
 * grows from it. What distinguishes them is the silhouette, and that is the
 * point — an acorn should not look like a lemon pip.
 */

const CENTER_X = 50

/** Every seed carries a darker outline of its own fill. */
const OUTLINE = -0.5
const OUTLINE_WIDTH = 0.7

const COLOR = {
  tinyDark: '#6B573A',
  tinyLight: '#7E6743',
  oval: '#8A7148',
  stripedBody: '#4A3B2C',
  stripedStripe: '#E4DAC6',
  bulb: '#C79A6A',
  bulbRoot: '#B7A98C',
  pod: '#9A8355',
  crescent: '#8B7247',
  husk: '#A89468',
  huskBristle: '#C6B489',
  tuberDark: '#9C7B52',
  tuberLight: '#B08B60',
  acornNut: '#B98A50',
  acornCap: '#7E5B37',
  acornStalk: '#6B4E2E',
  pit: '#A6825A',
  pip: '#8E7148',
  wingBody: '#8A7448',
  wingBlade: '#CFC199',
  cone: '#8A6A44',
  nut: '#C6B87E',
  nutTip: '#8E8256',
} as const

interface SeedContext {
  cy: number
  paint: PaintRegistry
}

/** Shared outline props for the main body of a seed. */
const outlined = (color: string) => ({
  stroke: mix(color, OUTLINE),
  strokeWidth: OUTLINE_WIDTH,
  strokeLinejoin: 'round' as const,
})

const tiny = ({ cy, paint }: SeedContext): ReactElement[] =>
  [
    [-3.6, 1],
    [0.4, -0.6],
    [3.4, 1.4],
  ].map(([dx = 0, dy = 0], index) => {
    const color = index % 2 ? COLOR.tinyDark : COLOR.tinyLight
    const x = CENTER_X + dx
    const y = cy + dy
    return (
      <ellipse
        key={`tiny-${index}`}
        cx={x}
        cy={y}
        rx={1.5}
        ry={1.15}
        fill={paint.fill(color)}
        transform={`rotate(${index * 35 - 25} ${x} ${y})`}
        {...outlined(color)}
      />
    )
  })

const oval = ({ cy, paint }: SeedContext): ReactElement[] =>
  [
    [-2.6, 0.6],
    [2.4, 1.2],
  ].map(([dx = 0, dy = 0], index) => {
    const x = CENTER_X + dx
    const y = cy + dy
    return (
      <ellipse
        key={`oval-${index}`}
        cx={x}
        cy={y}
        rx={2.2}
        ry={1.5}
        fill={paint.fill(COLOR.oval)}
        transform={`rotate(${index ? 18 : -16} ${x} ${y})`}
        {...outlined(COLOR.oval)}
      />
    )
  })

const striped = ({ cy, paint }: SeedContext): ReactElement[] => [
  <ellipse
    key="body"
    cx={CENTER_X}
    cy={cy}
    rx={2.6}
    ry={4}
    fill={paint.fill(COLOR.stripedBody)}
    transform={`rotate(-16 ${CENTER_X} ${cy})`}
    {...outlined(COLOR.stripedBody)}
  />,
  <path
    key="stripe-a"
    d={`M${CENTER_X - 1} ${cy - 2.6} L${CENTER_X - 1.6} ${cy + 2.4}`}
    stroke={COLOR.stripedStripe}
    strokeWidth={0.75}
    opacity={0.85}
  />,
  <path
    key="stripe-b"
    d={`M${CENTER_X + 0.9} ${cy - 2.2} L${CENTER_X + 0.4} ${cy + 2.6}`}
    stroke={COLOR.stripedStripe}
    strokeWidth={0.75}
    opacity={0.7}
  />,
]

const bulb = ({ cy, paint }: SeedContext): ReactElement[] => [
  <path
    key="body"
    d={
      `M${CENTER_X} ${cy - 5} C${CENTER_X + 4.6} ${cy - 3} ${CENTER_X + 4.2} ${cy + 3.4} ${CENTER_X} ${cy + 4}` +
      ` C${CENTER_X - 4.2} ${cy + 3.4} ${CENTER_X - 4.6} ${cy - 3} ${CENTER_X} ${cy - 5} Z`
    }
    fill={paint.fill(COLOR.bulb)}
    {...outlined(COLOR.bulb)}
  />,
  <path
    key="skin"
    d={`M${CENTER_X} ${cy - 5} Q${CENTER_X + 1.4} ${cy - 1} ${CENTER_X} ${cy + 3.6}`}
    stroke={mix(COLOR.bulb, -0.3)}
    strokeWidth={0.7}
    fill="none"
    opacity={0.7}
  />,
  <path
    key="roots"
    d={
      `M${CENTER_X - 1.6} ${cy + 4} l-1.4 2.6` +
      `M${CENTER_X} ${cy + 4.2} l0 2.8` +
      `M${CENTER_X + 1.6} ${cy + 4} l1.4 2.6`
    }
    stroke={COLOR.bulbRoot}
    strokeWidth={0.6}
    fill="none"
  />,
]

const pod = ({ cy, paint }: SeedContext): ReactElement[] => [
  <ellipse
    key="body"
    cx={CENTER_X}
    cy={cy}
    rx={4.2}
    ry={2.8}
    fill={paint.fill(COLOR.pod)}
    {...outlined(COLOR.pod)}
  />,
  <path
    key="lid"
    d={`M${CENTER_X - 4.2} ${cy - 0.6} Q${CENTER_X} ${cy - 3.4} ${CENTER_X + 4.2} ${cy - 0.6}`}
    stroke={mix(COLOR.pod, -0.35)}
    strokeWidth={0.8}
    fill="none"
  />,
]

const crescent = ({ cy, paint }: SeedContext): ReactElement[] =>
  [
    [-2.4, 0],
    [2.2, 0.8],
  ].map(([dx = 0, dy = 0], index) => {
    const x = CENTER_X + dx
    const y = cy + dy
    return (
      <path
        key={`crescent-${index}`}
        d={
          `M${x - 2.4} ${y + 1.4} Q${x} ${y - 3.2} ${x + 2.4} ${y + 1.4}` +
          ` Q${x} ${y - 0.6} ${x - 2.4} ${y + 1.4} Z`
        }
        fill={paint.fill(COLOR.crescent)}
        {...outlined(COLOR.crescent)}
      />
    )
  })

const husk = ({ cy, paint }: SeedContext): ReactElement[] => [
  <ellipse
    key="body"
    cx={CENTER_X}
    cy={cy}
    rx={2.2}
    ry={3.4}
    fill={paint.fill(COLOR.husk)}
    transform={`rotate(12 ${CENTER_X} ${cy})`}
    {...outlined(COLOR.husk)}
  />,
  ...Array.from({ length: 4 }, (_unused, index) => (
    <path
      key={`bristle-${index}`}
      d={`M${CENTER_X - 1.4 + index * 0.9} ${cy - 3} l${index - 1.6} -3.4`}
      stroke={COLOR.huskBristle}
      strokeWidth={0.6}
      strokeLinecap="round"
    />
  )),
]

const tuber = ({ cy, paint }: SeedContext): ReactElement[] =>
  [
    [-2.8, 0.4, 14],
    [1.8, -0.4, -18],
    [3.4, 2, 26],
  ].map(([dx = 0, dy = 0, angle = 0], index) => {
    const color = index % 2 ? COLOR.tuberLight : COLOR.tuberDark
    const x = CENTER_X + dx
    const y = cy + dy
    return (
      <ellipse
        key={`tuber-${index}`}
        cx={x}
        cy={y}
        rx={1.8}
        ry={3.4}
        fill={paint.fill(color)}
        transform={`rotate(${angle} ${x} ${y})`}
        {...outlined(COLOR.tuberDark)}
      />
    )
  })

const acorn = ({ cy, paint }: SeedContext): ReactElement[] => [
  <path
    key="nut"
    d={`M${CENTER_X - 3} ${cy - 1} Q${CENTER_X} ${cy + 5.4} ${CENTER_X + 3} ${cy - 1} Z`}
    fill={paint.fill(COLOR.acornNut)}
    {...outlined(COLOR.acornNut)}
  />,
  <path
    key="cap"
    d={`M${CENTER_X - 3.6} ${cy - 1.2} Q${CENTER_X} ${cy - 4.6} ${CENTER_X + 3.6} ${cy - 1.2} Z`}
    fill={paint.fill(COLOR.acornCap)}
    {...outlined(COLOR.acornCap)}
  />,
  <path
    key="stalk"
    d={`M${CENTER_X} ${cy - 3.8} l0.4 -2.4`}
    stroke={COLOR.acornStalk}
    strokeWidth={0.9}
    strokeLinecap="round"
  />,
]

const pit = ({ cy, paint }: SeedContext): ReactElement[] => [
  <ellipse
    key="body"
    cx={CENTER_X}
    cy={cy}
    rx={3}
    ry={4}
    fill={paint.fill(COLOR.pit)}
    transform={`rotate(-12 ${CENTER_X} ${cy})`}
    {...outlined(COLOR.pit)}
  />,
  <path
    key="groove"
    d={`M${CENTER_X - 1.6} ${cy - 2.6} Q${CENTER_X - 0.4} ${cy} ${CENTER_X - 1.2} ${cy + 2.8}`}
    stroke={mix(COLOR.pit, -0.35)}
    strokeWidth={0.7}
    fill="none"
  />,
]

const pip = ({ cy, paint }: SeedContext): ReactElement[] =>
  [
    [-2, 0.6, -20],
    [2.2, 0, 16],
  ].map(([dx = 0, dy = 0, angle = 0], index) => {
    const x = CENTER_X + dx
    const y = cy + dy
    return (
      <path
        key={`pip-${index}`}
        d={
          `M${x} ${y - 3} C${x + 2.2} ${y - 1} ${x + 1.6} ${y + 2.6} ${x} ${y + 3}` +
          ` C${x - 1.6} ${y + 2.6} ${x - 2.2} ${y - 1} ${x} ${y - 3} Z`
        }
        fill={paint.fill(COLOR.pip)}
        transform={`rotate(${angle} ${x} ${y})`}
        {...outlined(COLOR.pip)}
      />
    )
  })

const wing = ({ cy, paint }: SeedContext): ReactElement[] => [
  <ellipse
    key="body"
    cx={CENTER_X - 1}
    cy={cy + 1.4}
    rx={1.8}
    ry={1.4}
    fill={paint.fill(COLOR.wingBody)}
    {...outlined(COLOR.wingBody)}
  />,
  <path
    key="blade"
    d={
      `M${CENTER_X + 0.4} ${cy + 1} Q${CENTER_X + 6} ${cy - 3.6} ${CENTER_X + 7.4} ${cy - 6.4}` +
      ` Q${CENTER_X + 3.4} ${cy - 3.4} ${CENTER_X + 0.4} ${cy + 1} Z`
    }
    fill={paint.fill(COLOR.wingBlade)}
    opacity={0.95}
    {...outlined(COLOR.wingBlade)}
  />,
]

const cone = ({ cy, paint }: SeedContext): ReactElement[] => [
  <path
    key="body"
    d={`M${CENTER_X} ${cy - 5.4} L${CENTER_X + 2.8} ${cy + 3.6} L${CENTER_X - 2.8} ${cy + 3.6} Z`}
    fill={paint.fill(COLOR.cone)}
    {...outlined(COLOR.cone)}
  />,
  ...Array.from({ length: 3 }, (_unused, index) => (
    <path
      key={`scale-${index}`}
      d={
        `M${CENTER_X - 2.2 + index * 0.4} ${cy - 1.6 + index * 2}` +
        ` L${CENTER_X + 2.2 - index * 0.4} ${cy - 1.6 + index * 2}`
      }
      stroke={mix(COLOR.cone, -0.35)}
      strokeWidth={0.6}
    />
  )),
]

const nut = ({ cy, paint }: SeedContext): ReactElement[] => [
  <circle
    key="body"
    cx={CENTER_X}
    cy={cy + 0.4}
    r={3.4}
    fill={paint.fill(COLOR.nut)}
    {...outlined(COLOR.nut)}
  />,
  <path
    key="tip"
    d={`M${CENTER_X} ${cy - 3} l0 -2.4`}
    stroke={COLOR.nutTip}
    strokeWidth={0.9}
    strokeLinecap="round"
  />,
]

const SHAPES: Readonly<Record<SeedShape, (context: SeedContext) => ReactElement[]>> = {
  tiny,
  oval,
  striped,
  bulb,
  pod,
  crescent,
  husk,
  tuber,
  acorn,
  pit,
  wing,
  cone,
  pip,
  nut,
}

/**
 * Small seeds are scaled up more than bulky ones, so a cluster of tiny grains
 * stays as readable as a single acorn.
 */
const SMALL_SHAPES: readonly SeedShape[] = ['tiny', 'oval', 'pip', 'crescent', 'wing']
export const seedScaleFor = (shape: SeedShape): number =>
  SMALL_SHAPES.includes(shape) ? 2.5 : 1.9

export const drawSeed = (shape: SeedShape, cy: number, paint: PaintRegistry): ReactElement[] =>
  SHAPES[shape]({ cy, paint })

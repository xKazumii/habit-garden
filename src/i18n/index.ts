import { de } from './de'

type Messages = typeof de

/** An entry with these keys is read via `tCount()`. */
interface PluralForms {
  zero?: string
  one: string
  other: string
}

/** Every path that points at a string — e.g. 'tabs.garden'. */
type LeafKeys<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${LeafKeys<T[K]>}`
}[keyof T & string]

/** Every path that points at a plural form — e.g. 'garden.needsWater'. */
type PluralKeys<T> = {
  [K in keyof T & string]: T[K] extends string
    ? never
    : T[K] extends PluralForms
      ? K
      : `${K}.${PluralKeys<T[K]>}`
}[keyof T & string]

export type MessageKey = LeafKeys<Messages>
export type PluralKey = PluralKeys<Messages>

export type Replacements = Record<string, string | number>

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g
const KEY_SEPARATOR = '.'

const lookup = (key: string): unknown =>
  key.split(KEY_SEPARATOR).reduce<unknown>((node, part) => {
    if (typeof node !== 'object' || node === null) return undefined
    return (node as Record<string, unknown>)[part]
  }, de)

const interpolate = (template: string, replacements: Replacements): string =>
  template.replace(PLACEHOLDER_PATTERN, (match: string, name: string) =>
    name in replacements ? String(replacements[name]) : match,
  )

const isPluralForms = (value: unknown): value is PluralForms =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Partial<PluralForms>).one === 'string' &&
  typeof (value as Partial<PluralForms>).other === 'string'

/** Visibly falls back to the key instead of rendering a blank. */
const fallback = (key: string): string => {
  if (import.meta.env.DEV) console.warn(`[i18n] No string for "${key}"`)
  return key
}

export const t = (key: MessageKey, replacements?: Replacements): string => {
  const template = lookup(key)
  if (typeof template !== 'string') return fallback(key)
  return replacements ? interpolate(template, replacements) : template
}

/**
 * Plural form matching the count. `count` is automatically available inside the
 * string as the `{count}` placeholder.
 */
export const tCount = (key: PluralKey, count: number, replacements: Replacements = {}): string => {
  const forms = lookup(key)
  if (!isPluralForms(forms)) return fallback(key)

  const form =
    count === 0 && forms.zero !== undefined ? forms.zero : count === 1 ? forms.one : forms.other

  return interpolate(form, { count, ...replacements })
}

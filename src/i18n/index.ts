import { de } from './de'

type Messages = typeof de

/** Ein Eintrag mit diesen Schlüsseln wird über `tCount()` gelesen. */
interface PluralForms {
  zero?: string
  one: string
  other: string
}

/** Alle Pfade, die auf einen Text zeigen — z. B. 'tabs.garden'. */
type LeafKeys<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${LeafKeys<T[K]>}`
}[keyof T & string]

/** Alle Pfade, die auf eine Pluralform zeigen — z. B. 'garden.needsWater'. */
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

/** Fällt sichtbar auf den Schlüssel zurück, statt eine leere Stelle zu zeigen. */
const fallback = (key: string): string => {
  if (import.meta.env.DEV) console.warn(`[i18n] Kein Text für "${key}"`)
  return key
}

export const t = (key: MessageKey, replacements?: Replacements): string => {
  const template = lookup(key)
  if (typeof template !== 'string') return fallback(key)
  return replacements ? interpolate(template, replacements) : template
}

/**
 * Pluralform passend zur Anzahl. `count` steht im Text automatisch als
 * Platzhalter `{count}` zur Verfügung.
 */
export const tCount = (key: PluralKey, count: number, replacements: Replacements = {}): string => {
  const forms = lookup(key)
  if (!isPluralForms(forms)) return fallback(key)

  const form =
    count === 0 && forms.zero !== undefined ? forms.zero : count === 1 ? forms.one : forms.other

  return interpolate(form, { count, ...replacements })
}

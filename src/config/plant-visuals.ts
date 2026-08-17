import type { GrowthStage, HealthState } from '../types'

/**
 * Maße und Zustandsregeln der Pflanzen-Illustration.
 *
 * Alle Werte stammen aus dem Design-Prototyp. Die Illustration ist prozedural:
 * Stufe und Gesundheit sind zwei unabhängige Achsen, es gibt keine 20 gemalten
 * Varianten. Stufe skaliert die Geometrie, Gesundheit legt sich als
 * Überlagerung darüber.
 */

/** Leinwand. Höher als breit, damit über der Pflanze Luft für den Hinweis bleibt. */
export const PLANT_VIEWBOX = '0 0 100 116'
export const PLANT_ASPECT = 1.16

/** Mitte und Bodenlinie — der Fußpunkt, um den geneigt und gewiegt wird. */
export const CENTER_X = 50
export const GROUND_Y = 106

export const PLANT_SHADOW = { cx: 50, cy: 108, rx: 26, ry: 5.5 } as const

/** Zwei Erdhügel: der zweite ist nur eine Aufhellung auf dem ersten. */
export const SOIL_MOUND_PATH = 'M24 108 Q50 90 76 108 Z'
export const SOIL_HIGHLIGHT_PATH = 'M31 108 Q50 96 69 108 Z'

/** Stufe 0 ist immer nur ein Samen in der Erde, unabhängig von der Art. */
export const SEED = { cx: 50, cy: 98, rx: 3.4, ry: 2.6 } as const
export const SEED_SHEEN_PATH = 'M46 101 Q50 99 54 101'
export const SEED_SHEEN_WIDTH = 1.2

/** Wassertropfen oben rechts, wenn eine Pflanze durstig ist. */
export const DROP_HINT_PATH =
  'M86 12c3.4 4 5.2 6.3 5.2 8.4a5.2 5.2 0 1 1-10.4 0c0-2.1 1.8-4.4 5.2-8.4Z'
export const DROP_HINT_OPACITY = 0.95

/**
 * Wachstumsfaktor je Stufe, indiziert mit `growthStage` (0–4).
 * Skaliert Höhe, Blattgröße und Kronenradius.
 */
export const GROWTH_FACTOR: Readonly<Record<GrowthStage, number>> = {
  0: 0,
  1: 0.16,
  2: 0.44,
  3: 0.75,
  4: 1,
}

/**
 * Wie sich ein Gesundheitszustand auf die Darstellung legt.
 *
 * Bewusst vollständig datengetrieben: die Komponente entscheidet nichts
 * selbst, sie liest hier ab. Ein neuer Zustand wäre ein neuer Eintrag.
 */
export interface HealthRender {
  /** Neigung um den Fußpunkt, in Grad. Negativ = leicht zum Betrachter. */
  rotation: number
  /** CSS-Filter auf der ganzen Leinwand. `undefined` = kein Filter. */
  filter: string | undefined
  opacity: number
  /** Absacken in Leinwandeinheiten — die Pflanze hängt tiefer. */
  sink: number
  /** Stauchung längs der Achse. Wirkt wie ein stärkeres Beugen. */
  slump: number
  /** Lebende Pflanzen wiegen sich, welke und eingegangene nicht. */
  sways: boolean
  /** Wassertropfen-Hinweis über der Pflanze. */
  showsDropHint: boolean
  /** Trockene, hellere Erde. */
  drySoil: boolean
}

export const HEALTH_RENDER: Readonly<Record<HealthState, HealthRender>> = {
  healthy: {
    rotation: 0,
    filter: undefined,
    opacity: 1,
    sink: 0,
    slump: 1,
    sways: true,
    showsDropHint: false,
    drySoil: false,
  },
  thirsty: {
    rotation: -3.5,
    filter: 'saturate(.72) brightness(1.04)',
    opacity: 0.97,
    sink: 0,
    slump: 1,
    sways: true,
    showsDropHint: true,
    drySoil: false,
  },
  wilting: {
    rotation: 8,
    filter: 'saturate(.3) sepia(.2) brightness(.95)',
    opacity: 0.9,
    sink: 2,
    slump: 1,
    sways: false,
    showsDropHint: false,
    drySoil: true,
  },
  /*
   * Gleiche Neigung wie welk, aber stärker gebeugt: die Pflanze sackt weiter
   * ab und wird gestaucht. Farbe fast raus, ins Bräunlich-Graue.
   */
  dead: {
    rotation: 8,
    filter: 'saturate(.12) sepia(.34) brightness(.86)',
    opacity: 0.82,
    sink: 4,
    slump: 0.93,
    sways: false,
    showsDropHint: false,
    drySoil: true,
  },
}

/** Standardgrößen, damit die Screens keine eigenen Zahlen erfinden. */
export const PLANT_SIZE = {
  /** Zeile in „Heute". */
  row: 44,
  /** Bereits erledigte Zeile in „Heute" — kleiner, weil abgehakt. */
  rowDone: 36,
  /** Vorschau im Anpflanz-Flow. */
  preview: 56,
  /** Kachel in der Sortenauswahl. */
  tile: 62,
  /** Kategorie-Karte in Schritt 1. */
  category: 60,
  /** Kachel im Beet. */
  bed: 74,
  /** Bestätigung nach dem Anpflanzen. */
  planted: 120,
  /** Kopf des Detail-Sheets. */
  detail: 158,
} as const

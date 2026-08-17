/** Kategorie einer Pflanze — bestimmt, wie viele Punkte eine Wachstumsstufe kostet. */
export type PlantCategory = 'herb' | 'flower' | 'tree'

export type PlantStatus = 'alive' | 'dead'

/** 0 Samen, 1 Keimling, 2 Jungpflanze, 3 ausgewachsen, 4 blühend. */
export type GrowthStage = 0 | 1 | 2 | 3 | 4

/**
 * Darstellungszustand.
 * Reihenfolge der Präzedenz: dead > wilting > thirsty > healthy.
 */
export type HealthState = 'healthy' | 'thirsty' | 'wilting' | 'dead'

/**
 * Was tatsächlich in IndexedDB liegt.
 *
 * Hier stehen ausschließlich Rohdaten. Alles, was sich aus Zeitstempeln
 * ableiten lässt, wird NICHT gespeichert, sondern bei jedem Render neu
 * berechnet — siehe `PlantState`.
 */
export interface Plant {
  id: string
  category: PlantCategory
  species: string
  habitName: string
  intervalDays: number
  createdAt: number
  lastWateredAt: number | null
  /** Zeitstempel aller Gießvorgänge, aufsteigend sortiert. */
  waterings: number[]
  growthPoints: number
  /**
   * Zwischengespeicherter Status, damit er in IndexedDB abfragbar ist.
   * Die Wahrheit liegt in `PlantState.status`; die Datenschicht schreibt ein
   * erkanntes 'dead' zurück. Einmal 'dead' bleibt 'dead'.
   */
  status: PlantStatus
}

/**
 * Einstellungen des Gartens. Genau eine Zeile mit fester id — es gibt nur ein
 * Set, deshalb kein Key-Value-Schema.
 *
 * Das Theme steht bewusst NICHT hier, sondern in localStorage: es muss vor dem
 * ersten Paint synchron lesbar sein und gehört zum Gerät, nicht zum Garten.
 */
export interface GardenSettings {
  id: string
  /** Leer, wenn beim Start übersprungen wurde. */
  gardenerName: string
  /** Wann die Begrüßung beantwortet wurde. `null` = noch nie gezeigt. */
  onboardedAt: number | null
}

/** Felder, die zum Anpflanzen nötig sind. Alles andere setzt die Datenschicht. */
export interface NewPlantInput {
  category: PlantCategory
  species: string
  habitName: string
  intervalDays: number
}

/**
 * Vollständig abgeleiteter Zustand. Wird nie persistiert.
 * Immer aus Zeitstempeln berechnet, nie über Timer oder Intervalle.
 */
export interface PlantState {
  status: PlantStatus
  growthStage: GrowthStage
  /** 0–100. */
  health: number
  healthState: HealthState
  /** Gießen ist erlaubt. */
  isDue: boolean
  /** Karenz überschritten, die Gesundheit sinkt bereits. */
  isOverdue: boolean
  /** Anzahl Intervalle, für die schon Gesundheit abgezogen wurde. */
  missedIntervals: number
  /** Aufeinanderfolgende Intervalle ohne Verpassen. */
  streak: number
  /** Lokale Mitternacht des Tages, an dem gegossen werden darf. */
  dueAt: number
  /** Negativ = überfällig, 0 = heute fällig, positiv = noch Zeit. */
  daysUntilDue: number
  /** Punkte innerhalb der aktuellen Stufe. */
  pointsIntoStage: number
  /** Punkte, die eine Stufe dieser Kategorie kostet. */
  pointsPerStage: number
  /** 0–1, Fortschritt zur nächsten Stufe. 1 auf der höchsten Stufe. */
  stageProgress: number
}

/** Pflanze plus berechneter Zustand — das, was die UI konsumiert. */
export interface DerivedPlant extends Plant {
  state: PlantState
}

/** Gründe, aus denen die Wachstumslogik das Gießen ablehnt. */
export type WaterFailure = 'not-due' | 'dead'

/** Ergebnis eines Gießversuchs. Kein Werfen, damit die UI es direkt auswerten kann. */
export type WaterOutcome = { ok: true; plant: Plant } | { ok: false; reason: WaterFailure }

/** Wie `WaterOutcome`, aber die Datenschicht kann die Pflanze auch nicht finden. */
export type StoredWaterOutcome =
  | { ok: true; plant: Plant }
  | { ok: false; reason: WaterFailure | 'missing' }

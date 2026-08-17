/**
 * Alle sichtbaren Texte der App. In Komponenten steht kein einziger
 * hartkodierter String — Zugriff ausschließlich über `t()` bzw. `tCount()`.
 *
 * Aufbau: nach Bereich gruppiert. Ein Eintrag mit den Schlüsseln
 * `zero`/`one`/`other` ist eine Pluralform und wird über `tCount()` gelesen.
 * Platzhalter werden als `{name}` geschrieben.
 */
export const de = {
  app: {
    name: 'Habit Garden',
    tagline: 'Ein Garten für deine Gewohnheiten',
  },

  shell: {
    seedingTitle: 'Die Beete werden vorbereitet',
    seedingBody:
      'Das Fundament steht: Wachstumslogik, Datenbank und Offline-Betrieb. Die Screens kommen als Nächstes.',
  },

  tabs: {
    garden: 'Garten',
    today: 'Heute',
    settings: 'Einstellungen',
  },

  category: {
    herb: {
      name: 'Kräuter',
      hint: 'Schnell wachsend – für tägliche Gewohnheiten',
    },
    flower: {
      name: 'Blumen',
      hint: 'Mittleres Tempo – für Routinen im Aufbau',
    },
    tree: {
      name: 'Bäume',
      hint: 'Langsam – für langfristige Ziele',
    },
  },

  species: {
    basil: { name: 'Basilikum' },
    sunflower: { name: 'Sonnenblume' },
    oak: { name: 'Eiche' },
  },

  stage: {
    seed: 'Samen',
    sprout: 'Keimling',
    young: 'Jungpflanze',
    grown: 'Ausgewachsen',
    blooming: 'Blühend',
  },

  health: {
    healthy: 'gesund',
    thirsty: 'durstig',
    wilting: 'welk',
    dead: 'eingegangen',
  },

  garden: {
    needsWater: {
      zero: 'Heute ist alles gegossen',
      one: 'Eine Pflanze braucht heute Wasser',
      other: '{count} Pflanzen brauchen heute Wasser',
    },
  },
} as const

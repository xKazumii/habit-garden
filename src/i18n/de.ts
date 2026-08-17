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
    loading: 'Der Garten wird geladen …',
  },

  tabs: {
    navLabel: 'Hauptbereiche',
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

  theme: {
    system: 'System',
    light: 'Hell',
    dark: 'Dunkel',
  },

  onboarding: {
    title: 'Willkommen im Habit Garden',
    body: 'Jede Gewohnheit wird hier zu einer Pflanze. Bevor es losgeht: wie sollen wir dich begrüßen?',
    nameLabel: 'Dein Name',
    namePlaceholder: 'Stöpsi',
    submit: 'Los geht’s',
    skip: 'Überspringen',
    privacy: 'Bleibt auf diesem Gerät — wie alles andere in dieser App.',
  },

  rhythm: {
    daily: 'täglich',
    every2: 'alle 2 Tage',
    every3: 'alle 3 Tage',
    weekly: 'wöchentlich',
    everyN: 'alle {count} Tage',
    custom: 'eigener Wert',
  },

  garden: {
    greeting: {
      morning: 'Guten Morgen',
      day: 'Guten Tag',
      evening: 'Guten Abend',
    },
    /* Zweite Fassung statt eines Platzhalters im selben Text: ohne Namen soll
       kein Komma und keine Lücke übrig bleiben. */
    greetingNamed: {
      morning: 'Guten Morgen, {name}',
      day: 'Guten Tag, {name}',
      evening: 'Guten Abend, {name}',
    },
    needsWater: {
      zero: 'Heute ist alles gegossen',
      one: 'Eine Pflanze braucht heute Wasser',
      other: '{count} Pflanzen brauchen heute Wasser',
    },
    dueCountLabel: {
      zero: 'Keine Pflanze ist fällig',
      one: 'Eine Pflanze ist fällig',
      other: '{count} Pflanzen sind fällig',
    },
    openPlant: '{habit} öffnen',
    plantAction: 'Neue Gewohnheit anpflanzen',
    meta: '{species} · {rhythm}',
    empty: {
      title: 'Dein Beet ist noch leer',
      body: 'Jede Gewohnheit wird hier zu einer Pflanze. Setze die erste und gieße sie, wann sie fällig ist.',
      action: 'Erste Pflanze setzen',
    },
  },

  today: {
    title: 'Heute',
    summary: '{open} offen · {done} erledigt',
    allDone: 'Alles erledigt für heute',
    restingBody: 'Alles gegossen. Dein Garten ruht.',
    doneToggle: 'Heute erledigt · {count}',
    waterAction: '{habit} gießen',
    meta: '{rhythm} · {stage}',
    empty: {
      title: 'Noch nichts zu tun',
      body: 'Sobald im Garten etwas wächst, steht hier, was heute Wasser braucht.',
    },
  },

  detail: {
    close: 'Schließen',
    subtitle: '{species} · {rhythm}',
    growth: 'Wachstum',
    streak: 'Streak',
    streakCount: {
      zero: 'noch keine Serie',
      one: '1× in Folge',
      other: '{count}× in Folge',
    },
    healthState: 'Zustand: {state}',
    stageProgress: 'Stufe {stage} von {max}',
    heatmapTitle: 'Letzte 8 Wochen',
    rate: '{percent} % versorgt',
    rateUnknown: 'noch keine Historie',
    water: 'Gießen',
    waterDueInDays: {
      one: 'Morgen wieder fällig',
      other: 'In {count} Tagen wieder fällig',
    },
    waterDead: 'Diese Pflanze ist eingegangen',
    edit: 'Bearbeiten',
    uproot: 'Ausgraben',
    uprootConfirmTitle: 'Wirklich ausgraben?',
    uprootConfirmBody:
      '„{habit}“ wird endgültig entfernt — mit Streak und Historie. Das lässt sich nicht zurückholen.',
    uprootConfirm: 'Endgültig ausgraben',
    uprootCancel: 'Behalten',
    editTitle: 'Gewohnheit bearbeiten',
    editSave: 'Speichern',
    editCancel: 'Abbrechen',
  },

  create: {
    stepStatus: 'Schritt {current} von {total}',
    back: 'Zurück',
    cancel: 'Abbrechen',
    next: 'Weiter',
    submit: 'Einpflanzen',
    categoryTitle: 'Was möchtest du pflanzen?',
    categoryBody: 'Die Kategorie bestimmt, wie schnell deine Pflanze wächst.',
    speciesTitle: '{category} wählen',
    speciesBody: 'Jede Sorte hat ihren eigenen Charakter.',
    habitTitle: 'Gewohnheit definieren',
    habitBody: 'Beschreibe die Gewohnheit und ihren Rhythmus.',
    habitLabel: 'Gewohnheit',
    habitPlaceholder: '45 Minuten Buch lesen',
    rhythmLabel: 'Rhythmus',
    customDaysLabel: 'Alle wie viele Tage?',
    customDaysHint: 'Zwischen {min} und {max} Tagen',
    planted: {
      title: 'Eingepflanzt',
      body: '„{habit}“ ist gesät. Gieße sie {rhythm}.',
    },
  },

  settings: {
    title: 'Einstellungen',

    appearanceTitle: 'Darstellung',
    theme: {
      label: 'Erscheinungsbild',
      systemHint: 'Folgt automatisch deinem Gerät.',
      lightHint: 'Immer hell.',
      darkHint: 'Immer dunkel — tiefes Waldgrün.',
    },

    nameTitle: 'Dein Name',
    name: {
      label: 'Name',
      placeholder: 'Stöpsi',
      hint: 'Erscheint im Gruß über dem Beet. Leer lassen geht auch.',
    },

    dataTitle: 'Deine Daten',
    export: {
      label: 'Daten exportieren',
      hint: 'Alle Pflanzen als JSON-Datei sichern',
      empty: 'Es gibt noch keine Pflanzen zum Sichern.',
      done: 'Sicherung wurde heruntergeladen.',
      failed: 'Die Sicherung konnte nicht erstellt werden.',
    },
    import: {
      label: 'Daten importieren',
      hint: 'Sicherung einlesen und mit dem Garten zusammenführen',
      done: {
        one: 'Eine Pflanze übernommen.',
        other: '{count} Pflanzen übernommen.',
      },
      skipped: {
        one: 'Ein Datensatz wurde übersprungen.',
        other: '{count} Datensätze wurden übersprungen.',
      },
      failed: 'Die Datei konnte nicht gelesen werden.',
    },
    aboutTitle: 'Über die App',
    aboutBody:
      'Jede Gewohnheit ist eine Pflanze. Erledigt heißt gießen, gegossen heißt wachsen. Wer zu lange nicht gießt, sieht es der Pflanze an.',
    storageTitle: 'Wo die Daten liegen',
    storageBody:
      'Ausschließlich in diesem Browser, in einer lokalen Datenbank. Es gibt kein Konto und keinen Server. Wer den Browserspeicher löscht, löscht den Garten — deshalb lohnt sich der Export.',
    version: 'Version {version}',
  },
} as const

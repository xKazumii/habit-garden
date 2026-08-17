# Habit Garden

Eine PWA, in der jede Gewohnheit eine Pflanze ist. Gewohnheit erledigt → Pflanze
gießen → Pflanze wächst. Vernachlässigt → welkt → geht ein.

Alle Daten liegen ausschließlich lokal im Browser (IndexedDB). Es gibt kein
Backend und kein Konto.

---

## Base-Path — kritisch

Deployment als GitHub Project Page: **https://xkazumii.github.io/habit-garden/**

Drei Stellen müssen übereinstimmen, sonst lädt die App oder der Service Worker nicht:

| Stelle | Wert |
| --- | --- |
| `base` in `vite.config.ts` | `/habit-garden/` |
| `manifest.start_url` | `/habit-garden/` |
| `manifest.scope` | `/habit-garden/` |

Regeln:

- **Keine absoluten Asset-Pfade.** Nie `/icons/…` schreiben. Assets entweder über
  einen Vite-Import einbinden oder relativ angeben. Die Icon-Pfade im Manifest
  sind absichtlich relativ (`icons/icon-192.png`) — sie werden gegen die URL der
  `manifest.webmanifest` aufgelöst und bleiben damit unabhängig vom Base-Path.
- `index.html` verweist relativ auf `favicon.svg` und `apple-touch-icon.png`.
  Der Eintrag `src="/src/main.tsx"` ist die Vite-Konvention und wird beim Build
  korrekt umgeschrieben.
- `workbox.navigateFallback` muss ebenfalls den Base-Path enthalten.
- `theme_color` steht an **drei** Stellen: `vite.config.ts` (Manifest),
  `index.html` (Meta-Tag, helle Variante) und `src/config/theme.ts`
  (`THEME_COLOR`, beide Varianten für den Dark Mode). Die helle Farbe muss
  überall gleich sein. `src/lib/theme.test.ts` sichert den Abgleich zwischen
  `index.html` und `src/config/theme.ts` ab.

Nach dem ersten Deployment einmalig in GitHub: **Settings → Pages → Source →
GitHub Actions**. Das lässt sich nicht aus dem Repo heraus setzen.

---

## Updates in der installierten App

Eine installierte PWA hat **keinen Reload-Knopf**. Deshalb registriert die App
den Service Worker selbst (`src/hooks/useAppUpdate.ts`) und zeigt einen Hinweis,
wenn eine neue Version wartet — `UpdateBanner`, Knopf „Laden".

Drei Einstellungen hängen zusammen und dürfen nicht einzeln geändert werden:

| Stelle | Wert | Warum |
| --- | --- | --- |
| `registerType` | `'prompt'` | bei `'autoUpdate'` lädt die Seite ohne Rückfrage neu — mitten im Tippen wäre die Eingabe weg |
| `injectRegister` | `null` | sonst registriert das Plugin ein zweites Mal neben unserem Hook |
| Registrierung | `virtual:pwa-register` im Hook | nur so bekommen wir `onNeedRefresh` |

**Die Falle, die das ersetzt:** mit `registerType: 'autoUpdate'` **und** dem
eingespritzten `registerSW.js` enthielt die Registrierung gar keine
Reload-Logik. Die neue Version wurde beim Start geladen, angezeigt aber erst beim
*nächsten* — man brauchte zwei Starts, um ein Update zu sehen. Auf iOS heißt das
zusätzlich: aus dem App-Switcher wischen, Hintergrund reicht nicht.

Der Worker wartet jetzt und übernimmt erst auf `SKIP_WAITING` — nachprüfbar in
`dist/sw.js`. Zusätzlich fragt der Hook bei `visibilitychange` und `focus` nach
einer neuen Version, weil eine offene PWA tagelang kein `load` sieht. **Kein
Timer**, dieselbe Auslösung wie bei `useNow()`.

---

## Stack

- **Vite 8** + **React 19** + **TypeScript 7**
- **Tailwind CSS 4** über `@tailwindcss/vite`, CSS-first (`@theme inline`)
- **Dexie 4** für IndexedDB (`dexie-react-hooks` für `useLiveQuery`)
- **vite-plugin-pwa** (`generateSW`, `registerType: 'prompt'`, `injectRegister: null`)
- **Vitest 4** für die Kernlogik
- **Outfit** selbst gehostet über `@fontsource-variable/outfit` — kein
  Google-Fonts-CDN, weil die App offline laufen muss
- Node ≥ 22.12 (siehe `.nvmrc`; Vite 8 verlangt `^20.19.0 || >=22.12.0`)

**Kein Router.** Die drei Tabs laufen über State, damit GitHub Pages keinen
SPA-Fallback braucht.

### Befehle

```bash
npm run dev         # Dev-Server
npm test            # Vitest einmalig
npm run test:watch  # Vitest im Watch-Modus
npm run typecheck   # tsc -b --noEmit
npm run build       # tsc -b && vite build
npm run preview     # gebautes dist/ ausliefern (respektiert den Base-Path)
npm run icons       # Favicon und PWA-Icons neu erzeugen
```

---

## Verzeichnisse

```
src/
  config/growth.ts        Alle Konstanten der Wachstumsregeln
  config/species.ts       30 Arten: Farben, Formflags, Samenform, Preis
  config/plant-visuals.ts Leinwand, Wachstumsfaktoren, HEALTH_RENDER, Detailschwelle
  config/tabs.ts          TabId und Reihenfolge
  config/rhythms.ts       Rhythmus-Presets
  config/greeting.ts      Stundengrenzen des Tagesgrußes
  config/heatmap.ts       Fenstergröße der Heatmap
  config/theme.ts         Theme-Präferenzen, Speicherschlüssel, Theme-Farben
  config/settings.ts      Grenzen der Einstellungen
  config/economy.ts       Münze pro Gießen, Streak-Boni — die Auslegung
  config/coin.ts          Farben und Maße der Münze
  db/db.ts                Dexie-Schema (Version 2)
  db/plants.ts            Repository: anlegen, gießen, bearbeiten, ausgraben,
                          importieren
  db/settings.ts          Repository der Garten-Einstellungen
  i18n/de.ts              Alle sichtbaren Texte
  i18n/index.ts           t() und tCount()
  i18n/labels.ts          Beschriftungen aus Daten (Stufe, Zustand, Rhythmus)
  lib/time.ts             Kalendertag-Arithmetik
  lib/growth.ts           Wachstums- und Verwelklogik (UI-frei)
  lib/heatmap.ts          Acht Wochen Historie (UI-frei)
  lib/greeting.ts         Tageszeit (UI-frei)
  lib/backup.ts           Export erzeugen, Import validieren (UI-frei)
  lib/theme.ts            Theme-Auflösung (UI-frei)
  lib/coins.ts            Verdient, gebankt, Guthaben (UI-frei)
  lib/shop.ts             Freischaltzustand der Arten (UI-frei)
  lib/color.ts            mix() und mixTo() für die Illustration (UI-frei)
  lib/pseudo-random.ts    Deterministische Unregelmäßigkeit (UI-frei)
  hooks/useNow.ts         Zeitbezug ohne Timer
  hooks/usePlants.ts      useLiveQuery + derivePlants
  hooks/useSettings.ts    Einstellungen live aus IndexedDB
  hooks/useTheme.ts       localStorage, matchMedia, Attribut auf <html>
  components/             Geteilte UI: TabBar, BottomSheet, Buttons, Icons
  components/plant/       Die prozedurale Pflanzen-Illustration
  screens/garden/         Garten
  screens/today/          Heute
  screens/detail/         Detail-Sheet inkl. Bearbeiten und Heatmap
  screens/create/         Anpflanz-Flow
  screens/onboarding/     Begrüßung beim ersten Start
  screens/shop/           Samenladen
  screens/settings/       Einstellungen inkl. Darstellung und Name
  globals.d.ts            __APP_VERSION__ (kommt aus vite.config.ts)
  types.ts                Datenmodell und abgeleitete Typen
scripts/                  Icon-Generierung
external/                 Design-Prototyp (nicht im Git)
thoughts/                 Planungsnotizen (nicht im Git)
learnings/                Lokale Notizen (nicht im Git)
```

---

## Datenmodell

Persistiert in IndexedDB (`habit-garden`, **Version 2**). Zwei Stores:
`plants` mit dem Index `id, createdAt, status, lastWateredAt, category` und
`settings` mit `id`. Frühere Versionen bleiben in `src/db/db.ts` deklariert,
sonst kann Dexie einen bestehenden Garten nicht hochziehen.

```ts
interface Plant {
  id: string
  category: 'herb' | 'flower' | 'tree'
  species: string           // 'basil' | 'sunflower' | 'oak'
  habitName: string
  intervalDays: number      // 1–30
  createdAt: number
  lastWateredAt: number | null
  waterings: number[]       // Zeitstempel, aufsteigend
  growthPoints: number
  status: 'alive' | 'dead'
}
```

**Nie persistiert, immer berechnet** (`PlantState` in `src/types.ts`):
`growthStage` 0–4, `health` 0–100, `healthState`, `isDue`, `isOverdue`,
`missedIntervals`, `streak`, `dueAt`, `daysUntilDue`, `pointsIntoStage`,
`pointsPerStage`, `stageProgress`.

Sonderfall `status`: steht im Datenmodell und ist damit persistiert, muss aber
aus Zeitstempeln erkannt werden. `derivePlantState()` berechnet den effektiven
Status; `reconcileStatus()` schreibt ein erkanntes `dead` zurück, damit es
abfragbar ist. **Einmal `dead` bleibt `dead`** — sonst würde ein späteres
Verlängern des Intervalls im Bearbeiten-Flow eine tote Pflanze wiederbeleben.

### Einstellungen

Genau eine Zeile im Store `settings`, feste id `'app'` — es gibt nur ein Set,
das rechtfertigt kein Key-Value-Schema:

```ts
interface GardenSettings {
  id: string
  gardenerName: string       // leer = beim Start übersprungen
  onboardedAt: number | null // null = Begrüßung noch nie beantwortet
  bankedCoins: number        // Münzen ausgegrabener Pflanzen
  purchases: PurchasedSeed[] // { speciesId, price, unlockedAt }
}
```

`getSettings()` mischt die Standardwerte **über** den gespeicherten Datensatz.
Deshalb braucht ein neues Feld keine Schemaversion: ein alter Eintrag ohne
`purchases` liefert kein `undefined`, sondern die leere Liste. Ob die Begrüßung
fällig ist, entscheidet allein `onboardedAt`.

**Das Theme steht bewusst nicht hier** — siehe den Abschnitt Dark Mode.

---

## Wachstums- und Verwelklogik

Vollständig in `src/lib/growth.ts`. Keine UI-, DOM- oder Datenbank-Abhängigkeit,
jede Funktion bekommt `now` übergeben. Getestet in `src/lib/growth.test.ts`.

### Grundsatz: keine Timer

Gesundheit, Stufe, Streak und Status werden **immer** aus den gespeicherten
Zeitstempeln berechnet — nie über `setInterval`, `setTimeout` oder einen Cron.
Eine App, die drei Wochen geschlossen war, ergibt beim Öffnen genau denselben
Zustand wie eine, die durchgehend offen stand.

### Fälligkeit rechnet in Kalendertagen

Bewusst **nicht** in 24-Stunden-Schritten. „Täglich" heißt einmal pro
Kalendertag: wer um 23:50 gießt, darf am nächsten Morgen wieder gießen. Bei
24h-Arithmetik würde die Fälligkeit mit jedem späten Gießen nach hinten wandern.

Zeitstempel bleiben Epoch-Millisekunden. Verglichen wird ausschließlich über
`dayNumber()` aus `src/lib/time.ts`: lokale Kalenderfelder → `Date.UTC(y, m, d)`
→ geteilt durch 86400000. Dadurch sommerzeitsicher — ein Tag mit 23 oder 25
Stunden zählt als genau ein Tag. **Nie mit `timestamp / 86400000` oder
`+ n * 86400000` rechnen.**

Bei Zeitzonenwechsel kann sich der Tagesindex eines vergangenen Gießens
verschieben. Das ist gewollt: die App folgt der Gerätezeit, so wie der Nutzer
den Tag wahrnimmt.

### Fälligkeitstag

```
dueDay = lastWateredAt === null
       ? dayNumber(createdAt)                   // neue Pflanze: sofort fällig
       : dayNumber(lastWateredAt) + intervalDays
```

Gießen ist nur erlaubt, wenn die Pflanze lebt und fällig ist. „Höchstens einmal
pro Intervall" ergibt sich automatisch, weil `dueDay` aus `lastWateredAt` folgt.

### Gesundheit

```
daysOverdue     = dayNumber(now) - dueDay
intervalsOverdue = daysOverdue < 0 ? 0 : floor(daysOverdue / intervalDays)
missedIntervals = max(0, intervalsOverdue - GRACE_INTERVALS + 1)
health          = clamp(100 - 25 * missedIntervals, 0, 100)
```

- `GRACE_INTERVALS = 1`: ein Intervall Karenz bei voller Gesundheit („durstig")
- danach −25 pro verpasstem Intervall
- Gesundheit 0 → `dead`. Bei Intervall 1 also 5 Tage nach dem letzten Gießen.

### Gesundheitszustände — Präzedenz, kein Schwellwert

Die ursprüngliche Spec nannte „gesund (>66)". Das kollidiert mit den
25er-Schritten: 75 Punkte bedeuten bereits ein verpasstes Intervall, wären nach
der Schwelle aber „gesund". Deshalb entscheidet die Reihenfolge, die keine Lücke
lässt:

| Zustand | Bedingung | Anzeige |
| --- | --- | --- |
| `dead` | Status `dead` bzw. Gesundheit 0 | eingegangen |
| `wilting` | Gesundheit < 100 | welk |
| `thirsty` | fällig, Karenz läuft noch (Gesundheit 100) | durstig |
| `healthy` | sonst | gesund |

### Wachstumsstufen

```
stage = min(4, floor(growthPoints / POINTS_PER_STAGE[category]))
```

Punkte pro Stufe: **Kraut 3, Blume 5, Baum 8.** Jedes Gießen gibt einen Punkt.
Fünf Stufen: 0 Samen, 1 Keimling, 2 Jungpflanze, 3 ausgewachsen, 4 blühend.

### Streak

Aufeinanderfolgende Intervalle ohne Verpassen.

- Pflanze hängt **aktuell** über der Karenz (`missedIntervals ≥ 1`) oder ist
  eingegangen → 0
- sonst `waterings` von neu nach alt durchlaufen und zählen, solange
  `missedIntervalsFor(gap - intervalDays, intervalDays) === 0` ist,
  also solange `gap < (GRACE_INTERVALS + 1) * intervalDays`

`missedIntervalsFor()` bewertet damit sowohl den aktuellen Rückstand als auch
vergangene Gießabstände. Gesundheit und Streak können deshalb nicht
auseinanderlaufen: genau der Abstand, der Gesundheit kostet, kostet auch den
Streak. Das Gießen einer welken Pflanze stellt die Gesundheit wieder her, setzt
den Streak aber auf 1 zurück.

---

## Design

Mobile-first, ausgelegt auf 390 px, responsiv bis Desktop. Die Werte stammen aus
dem Design-Prototyp und stehen als CSS-Variablen in `src/index.css`. **Keine
Farben, Radien, Schatten oder Kurven direkt in Komponenten.**

### Palette

| Rolle | Hell | Dunkel (vorbereitet) |
| --- | --- | --- |
| Hintergrund | `#FAF7F2` | `#1B241E` |
| Karten | `#FFFFFF` | `#243029` |
| Beet | `#F1EBE0` | `#202B23` |
| Inaktiv | `#E4DFD5` | `#2C3830` |
| Text | `#2E3A32` | `#E8EFE7` |
| Gedämpft | `#6B7A6E` | `#9AAB9C` |
| Primär (Salbei) | `#7C9885` | `#8FB199` |
| Akzent (Terrakotta) | `#D08C60` | `#D08C60` |
| Sekundär (staubiges Blau) | `#8FA9BF` | `#8FA9BF` |

Radien 16–24 px (Sheets 30, Beet 26). Weiche Schatten statt Borders, viel
Weißraum. Ausnahme nach unten: `--hg-radius-xs` mit 4 px, ausschließlich für die
Heatmap-Zellen.

Ergänzend zur Tabelle gibt es Tokens, die nur die Illustration und einzelne
Flächen brauchen: `--hg-soil`, `--hg-soil-dry`, `--hg-soil-highlight`,
`--hg-seed`, `--hg-seed-sheen`, `--hg-plant-shadow`, `--hg-on-accent`,
`--hg-shadow-bed` und die drei `--hg-heat-*`. **Auch dafür
gilt: keine Farbe direkt in einer Komponente.** Die einzige Ausnahme sind die
Pflanzenfarben je Art — die stehen geschlossen in `src/config/species.ts`, weil
sie zur Art gehören und nicht zum Theme.

### Dark Mode

Aktiv, steuerbar über **System / Hell / Dunkel** in den Einstellungen, Standard
„System". Drei Regeln, an denen sich nicht rütteln lässt:

1. **`data-theme` auf `<html>` trägt immer den aufgelösten Wert** — `light` oder
   `dark`, **nie** `system`. Aufgelöst wird in JavaScript über `matchMedia`.
   Deshalb steht in `src/index.css` bewusst **kein**
   `@media (prefers-color-scheme)`: das wäre eine zweite Kopie der kompletten
   Palette, und zwei Kopien driften.
2. **`@theme inline` ist Pflicht.** Nur so referenzieren die Utilities die
   Variable, statt ihren Wert zu kopieren — sonst wirkt der Wechsel zur Laufzeit
   nicht.
3. **Das Inline-Skript in `index.html` setzt das Attribut vor dem ersten
   Paint.** Ein React-Effekt liefe erst danach, die App würde hell aufblitzen.
   Das Skript dupliziert notgedrungen drei Werte aus `src/config/theme.ts`
   (Speicherschlüssel, Media Query, die beiden Canvas-Farben), weil es vor dem
   Bundle läuft und nichts importieren kann. `src/lib/theme.test.ts` vergleicht
   beide Stellen und prüft zusätzlich, dass das Skript **vor** dem Modul-Tag
   steht.

Die Präferenz liegt in **localStorage**, nicht in IndexedDB: sie muss synchron
vor dem Paint lesbar sein und gehört zum Gerät, nicht zum Garten — deshalb steht
sie auch nicht in der Sicherung.

Im `[data-theme='dark']`-Block stehen nur die Tokens, die sich ändern. Ohne
dunkle Variante bleiben Radien, Kurven, Dauern, die Erdfarben, `--hg-on-accent`
und die beiden farbigen Glows. Das ist Absicht und oben im Block vermerkt.

### Safe-Area-Insets

Nur über die Utilities `pt-safe`, `pb-safe`, `pl-safe`, `pr-safe`,
`pb-safe-nav`, `pb-safe-sheet`, `bottom-safe-fab`, `min-h-svh-safe`. Nie
`env(safe-area-inset-*)` in Komponenten. `index.html` braucht dafür
`viewport-fit=cover`.

`pb-safe-nav` gehört an die Tab Bar, `pb-safe-sheet` an den Fuß von Sheets und
Vollbild-Flows, `bottom-safe-fab` hält den FAB auf jedem Gerät über der Tab Bar.

### Eingabefelder — mindestens 16 px

**iOS Safari zoomt automatisch in jedes Eingabefeld, dessen Schriftgröße unter
16 px liegt**, und zoomt danach nicht vollständig zurück. Die Seite bleibt
verschoben, bis man von Hand zurückzieht.

Deshalb: **kein `text-sm` an einem `<input>`.** Alle Felder laufen über
`src/components/TextField.tsx`, das `text-base` setzt — die Regel gilt damit
einmal und nicht in jedem Screen erneut. `tone="raised"` liegt auf der Leinwand,
`tone="inset"` innerhalb einer Karte.

`maximum-scale=1` im Viewport wäre die andere Lösung und ist **keine Option** —
das schaltet das Pinch-Zoom für alle ab.

### Animationen

Keyframes aus dem Prototyp, als Tailwind-Utilities verfügbar:

| Utility | Keyframe | Zweck |
| --- | --- | --- |
| `animate-enter` | `hg-in` | Inhalte fahren beim Wechsel sanft ein |
| `animate-rise` | `hg-up` | Bottom Sheet und Vollbild-Flows von unten |
| `animate-sway` | `hg-sway` | lebende Pflanzen wiegen sich minimal |
| `animate-pulse-ring` | `hg-pulse` | Ring um fällige Pflanzen |
| `animate-pop` | `hg-pop` | Bestätigung nach dem Anpflanzen |
| `animate-drop` | `hg-drop` | Wassertropfen fällt beim Gießen auf die Pflanze |
| `animate-grow` | `hg-grow` | Pflanze hüpft beim Stufenaufstieg |
| `animate-flip` | `hg-flip` | Münze dreht sich zweimal in der Belohnung |

`prefers-reduced-motion: reduce` schaltet alle Animationen global ab.

---

## Pflanzen-Illustrationen

Flacher weicher Stil mit Konturen, **keine Emojis**. Eine Komponente
`<Plant species growthStage healthState size showDropHint celebrate pouring />`
in `src/components/plant/`. Sie ist rein dekorativ (`aria-hidden`) — den Namen
liefert immer das umgebende Element. Größen kommen aus `PLANT_SIZE` in
`src/config/plant-visuals.ts`, nie als lose Zahl aus einem Screen.

Prozedural: Stufe und Gesundheit sind zwei unabhängige Achsen, es gibt keine
gezeichneten Varianten.

### Aufbau der Dateien

| Datei | Aufgabe |
| --- | --- |
| `Plant.tsx` | die **einzige** Komponente: Registry, Boden, Körper, Overlays |
| `body.ts` | gemeinsamer `BodyContext`, abgeleitete Licht-/Schattenfarbe |
| `herb.tsx`, `flower.tsx`, `tree.tsx` | Zeichenfunktionen je Kategorie |
| `shapes.tsx` | Blatt, Stängel, organischer Blob |
| `seeds.tsx` | 14 Samenformen |
| `ground.tsx` | Erde, Kiesel, Gras, Risse, Falllaub |
| `paint.tsx` | Verlaufs-Registry |
| `tint.ts` | Gesundheitsfärbung der Palette |

### Zwei Mechanismen, die man kennen muss

**Die Körper sind Funktionen, keine Komponenten.** Jeder Vollton wird durch
einen `linearGradient` ersetzt, und die Verläufe müssen als `<defs>` im SVG
stehen. React rendert Kinder aber erst *nach* dem Elternteil — eine
Kind-Komponente könnte ihre Farbe nicht rechtzeitig anmelden. Deshalb laufen
`drawHerb`, `drawFlower` und `drawTree` synchron im Render von `Plant`:

```ts
const paint = createPaintRegistry(id, detail)
const ground = drawGround({ …, paint })     // meldet Farben an
const plant  = drawHerb(visual, context)    // meldet Farben an
return <svg><defs>{paint.defs()}</defs>{ground}{plant}</svg>
```

Die Reihenfolge ist wesentlich: `ground` und `plant` müssen als `const`
**vor** dem `return` berechnet werden, sonst ist `<defs>` leer.

**Gesundheit färbt die Palette, sie filtert nicht das Bild.** Kein
`filter: saturate(...)` mehr — `tint()` mischt die Artfarben Richtung eines
trockenen Braun, und `droop` beugt jedes Blatt herab. Das trifft nur die
Pflanze; die Erde hat ihre eigene Trocken-Variante.

| Zustand | Neigung | Hängen | Färbung | Stauchung | Deckkraft |
| --- | --- | --- | --- | --- | --- |
| gesund | 0° | 0 | – | – | 1 |
| durstig | −3° | 13 | 24 % → `#C9C293` | – | 1 |
| welk | +7° | 36 | 62 % → `#8B6636` | 0,82 | 0,96 |
| eingegangen | +9° | 48 | 82 % → `#6E5A44` | 0,72 | 0,88 |

Laub gibt schneller nach als Blüten und Früchte — eine welkende Sonnenblume
behält lange einen Rest Gelb. Holz vergraut stattdessen (`TRUNK_TINT_TARGET`).

**Die Pflanze verliert dabei kein Blatt und keine Krone.** Das Design nennt welk
„entsättigt, bräunlich" — eine Farbaussage. Ein früherer Versuch verkleinerte
zusätzlich Blätter und Kronen; die welke Eiche sah damit anders aus als in
`screenshots/c3.png`, wo sie eine volle braune Krone hat.

Dass welke **Kräuter** trotzdem kahl wirken, liegt an der Formel des Prototyps:
`droop` geht in den Blattwinkel zweimal ein (einmal mit Faktor 1,6, einmal
unskaliert), bei welk also rund 94° — die Blätter klappen an den Stängel. Das ist
übernommen. Hebel wäre `DROOP_LEVERAGE` in `herb.tsx`, dann aber bewusst gegen
das Design.

### Detailstufe

`detail = size >= DETAIL_MIN_SIZE` (72 px). Darunter entfallen Blattadern,
Kiesel, Verläufe und Funkeln. Das Beet rendert zwanzig Pflanzen gleichzeitig,
und bei 44 px sieht man ein Blattäderchen ohnehin nicht — das Markup wird so
rund 40 % kleiner.

### Geometrie

- **Leinwand** `viewBox="0 0 100 116"`, Bodenlinie y = 106. Der Erdhügel ist die
  Kuppel des Prototyps von y = 89,5 bis 108,6.
- **`PLANT_LIFT_Y` = 10,5** hebt die gewachsene Pflanze aus dem Hügel heraus.
  Ohne den Hub lägen 16 Einheiten Stängel über der Vorderseite der Kuppel und die
  Pflanze stünde *vor* dem Hügel statt aus ihm heraus zu wachsen. Hügel und Hub
  gehören zusammen — **wer eines ändert, muss das andere mit ändern.** Der Samen
  auf Stufe 0 wird bewusst *nicht* gehoben, er liegt auf der Erde. Der
  Wiege-Drehpunkt ist mitgewandert (`SWAY_ORIGIN_Y` = 96).
- **Wachstumsfaktor** pro Stufe `[0, .16, .44, .75, 1]`, indiziert mit
  `growthStage`. Skaliert Höhe, Blattgröße und Kronenradius.
- **Stufe 0** ist der Samen — 14 eigene Formen, siehe `SeedShape`. Bei Bäumen
  und Zwiebeln liegt auf Stufe 1 noch die leere Hülle daneben.
- **Kraut**: 1–6 Stängel je Stufe, Blattpaare an festen relativen Höhen.
  `form` bestimmt den Wuchs (`narrow` sind Halme ohne Stängel — Schnittlauch),
  `bloomStyle` die Blüte (`dot` oder `spike`), `frilly` ein zweites Blattpaar.
- **Blume**: Bodenrosette, 2–5 Stängel, Knospen die auf Stufe 4 in vier
  Blütenblattlagen aufgehen. Petalhöhe < 8 ergibt einen Cluster — mehr Stängel,
  kleinere Köpfe (Vergissmeinnicht).
- **Baum**: Stammfuß mit Verbreiterung, Äste, Krone aus fünf überlappenden
  Blobs (Schattenlage, Farblage, Glanz, gestrichelte Randkante). `conifer`
  ersetzt sie durch vier Zickzack-Etagen, `slim` verschmälert, `blossoms`
  streut Blütenpunkte, `paleBark` zeichnet Querstriche statt Längsschattierung.
- **Determinismus:** alle Unregelmäßigkeiten kommen aus `hashString(species)`.
  Kein `Math.random()` — dieselbe Art sieht immer gleich aus.
- Durstige Pflanzen bekommen einen Wassertropfen-Hinweis in `--hg-thirsty`,
  beim Gießen fällt einer herab (`pouring`).
- Lebende Pflanzen wiegen sich über `animate-sway`, welke nicht.

Artspezifisch sind nur Farben, ein paar Formflags, die Samenform und der Preis.
Eine neue Art ist damit reine Konfiguration: ein Eintrag in `SPECIES` und ein
Name in `src/i18n/de.ts`.

Dreißig Arten, zehn je Kategorie, innerhalb der Kategorie nach Preis
aufsteigend. Die ersten zwei jeder Kategorie sind Startarten (`price: 0`):

| Kategorie | Start | freischaltbar |
| --- | --- | --- |
| Kraut | Petersilie, Minze | Basilikum, Schnittlauch, Oregano, Thymian, Salbei, Zitronenmelisse, Rosmarin, Lavendel |
| Blume | Gänseblümchen, Sonnenblume | Ringelblume, Kornblume, Vergissmeinnicht, Mohn, Kosmee, Krokus, Tulpe, Dahlie |
| Baum | Eiche, Birke | Kiefer, Ahorn, Apfelbaum, Feigenbaum, Olivenbaum, Zitronenbaum, Kirschbaum, Ginkgo |

Die Reihenfolge in `SPECIES` bestimmt die Anzeige im Laden und im Anpflanz-Flow
sowie über `defaultSpeciesFor()` die Vorauswahl — deshalb stehen die Startarten
vorn. Eine Art wechselt allein über ihren Preis die Seite; es gibt keine zweite
Liste. Der Sortenschritt rechnet mit drei Spalten.

---

## Texte und Übersetzungen

Nur Deutsch, aber **kein hartkodierter sichtbarer String in Komponenten**. Alle
Texte stehen in `src/i18n/de.ts`, Zugriff über den typsicheren Helper:

```ts
t('tabs.garden')
t('detail.subtitle', { species, rhythm })
tCount('garden.needsWater', dueCount)   // zero / one / other, {count} automatisch
```

Neue Texte immer zuerst in `de.ts` ergänzen. Die Schlüssel sind typgeprüft, ein
Tippfehler fällt beim Typecheck auf. Ein Eintrag mit `zero`/`one`/`other` ist
eine Pluralform und wird über `tCount()` gelesen.

Template-Literale funktionieren, solange alle Varianten existieren — etwa
``t(`health.${state}`)`` oder ``t(`tabs.${tab}`)``. Das prüft der Typechecker
mit. Nur `species.<id>.name` braucht eine Zusicherung, weil `Plant.species` im
Datenmodell ein freier String ist; `t()` fällt dort sichtbar auf den Schlüssel
zurück und warnt im Dev-Modus.

Beschriftungen, die aus Daten entstehen, stehen gesammelt in
`src/i18n/labels.ts`: `stageLabel()`, `healthLabel()`, `categoryName()`,
`speciesName()`, `rhythmLabel()`. Nicht in den Screens nachbauen.

---

## Screens

Navigation über eine Bottom Tab Bar: Garten / Heute / Einstellungen.

1. **Garten** — Beet-Raster mit allen Pflanzen, Header mit Tagesgruß und
   „3 Pflanzen brauchen Wasser", fällige Pflanzen mit pulsierendem Ring,
   FAB zum Anpflanzen.
2. **Anpflanzen** — dreistufiger Flow: Kategorie → Sorte → Gewohnheit
   (Beschreibung, Rhythmus täglich / 2 / 3 / 7 Tage / eigener Wert).
3. **Pflanzen-Detail** — Bottom Sheet: große Pflanze, Gewohnheit, Stufe, Streak,
   „Gießen"-Button (deaktiviert wenn nicht fällig), Heatmap der letzten
   8 Wochen, Menü zum Bearbeiten/Ausgraben.
4. **Heute** — Liste der fälligen Gewohnheiten, erledigte klappen weg.
5. **Einstellungen** — Darstellung (System / Hell / Dunkel), Name,
   Export/Import als JSON-Datei (wichtig, da die Daten nur lokal liegen),
   Über die App.

Davor liegt ein Screen ohne Tab: die **Begrüßung beim ersten Start**. Sie fragt
nach dem Namen, lässt sich überspringen und erscheint nur, solange
`onboardedAt` null ist. Der Garten grüßt danach mit Namen
(`garden.greetingNamed.*`) oder ohne (`garden.greeting.*`) — zwei getrennte
Textfassungen, damit ohne Namen kein Komma übrig bleibt.

Kein Router: der aktive Tab und alle Overlays sind State in `src/App.tsx`.
Overlays liegen gestaffelt über der Shell — Detail-Sheet `z-20`, Anpflanzen
`z-30`, Bestätigung `z-40`, FAB darunter auf `z-10`.

### Bottom Sheet: Griff, Escape, Scrim

Das Sheet schließt auf drei Wegen: Tippen auf den Hintergrund, Escape und Zug am
Griff nach unten (ab 96 px oder bei schnellem Wisch).

Der Zug hängt **nur am Griff**, nicht am ganzen Sheet — der Inhalt scrollt, beide
Gesten am selben Element kämen sich in die Quere. Der Griff hat deshalb
`touch-none` und einen großzügigen Trefferbereich, ist aber `aria-hidden`: für
Tastatur und Screenreader gibt es Escape und die beschriftete Fläche dahinter.

Eine Falle beim Ändern: `animate-rise` läuft mit `fill-mode: both` und würde ein
inline gesetztes `transform` überstimmen. Die Klasse fliegt deshalb nach
`onAnimationEnd` raus, bevor der Zug greift.

### Zeitbezug in der UI

`useNow()` liefert den Zeitpunkt, aus dem alle Screens ihre Zustände ableiten,
und wird über `visibilitychange` und `focus` neu gelesen — **kein
`setInterval`**. Der Wert wird einmal in `App` geholt und nach unten gereicht,
damit nicht zwei Teile der App verschiedene Tage sehen.

### Heatmap

`src/lib/heatmap.ts` rekonstruiert für jeden der letzten 56 Kalendertage, wie
die Pflanze an dem Tag dastand — bewertet mit derselben `missedIntervalsFor()`,
die auch Gesundheit und Streak bestimmt.

| Zustand | Bedingung | Farbe |
| --- | --- | --- |
| `watered` | an dem Tag wurde gegossen | `--hg-heat-full` |
| `idle` | nichts fällig oder noch in der Karenz | `--hg-heat-partial` |
| `missed` | über die Karenz hinaus fällig, nicht gegossen | `--hg-heat-empty` |
| `before` | Tag liegt vor dem Anpflanzen | transparent |

Die Quote darüber ist der Anteil der Tage seit dem Anpflanzen, an denen die
Pflanze **versorgt** war (`watered` oder `idle`) — nicht der Anteil erledigter
Gießtermine. Sonst würde ein einzelnes verpasstes Intervall mehrfach zählen,
einmal pro überfälligem Tag.

Das Raster ist spaltenweise gefüllt, sieben Zeilen, letzte Zelle ist heute. Die
Spalten sind bewusst **nicht** auf Wochentage ausgerichtet.

### Sicherung

`src/lib/backup.ts` erzeugt und prüft die JSON-Datei, geschrieben wird über
`importPlants()` in `src/db/plants.ts`. Zwei Regeln:

- **Zusammenführen statt ersetzen** (`bulkPut` über die `id`). Ein Import
  löscht nie etwas, und dieselbe Datei zweimal einzulesen ändert nichts.
- **Die Kategorie kommt aus der Artdefinition**, nicht aus der Datei — sonst
  könnte eine manipulierte Sicherung eine Eiche als Kraut wachsen lassen.
  Unbekannte Arten werden übersprungen und gezählt, ein kaputter Datensatz
  kippt nicht den ganzen Import.

Die Datei enthält neben `plants` ein optionales `settings` mit dem Namen.
Optional heißt: ältere Sicherungen ohne das Feld lesen weiterhin sauber, und
`version` bleibt bei 1. Ein leerer Name in der Datei überschreibt einen
vorhandenen **nicht**.

### Münzen und Samenladen

Erreichbar über den Münz-Chip im Garten-Kopf, als Vollbild-Overlay wie der
Anpflanz-Flow. **Kein vierter Tab** — die App bleibt bei drei Bereichen.

Der tragende Gedanke: **Münzen werden berechnet, nicht gebucht.** Wie Gesundheit,
Stufe und Streak entsteht das Verdiente aus der Gießhistorie. Es gibt kein
Ereignis, das Münzen vergibt — und damit keine Doppelvergabe, keinen Abgleich
nach einem Import und keinen Timer.

```
Guthaben = verdient(alle Gießvorgänge) + gebankt − Summe der Käufe
```

| Quelle | Betrag |
| --- | --- |
| pro Gießen | 1 |
| Serie erreicht 7× / 14× / 30× / 60× / 100× | +5 / +10 / +25 / +50 / +100 |
| jede weiteren 100× | +100 |

Die Boni gelten **pro Serie, nicht einmalig**: wer nach einem Abbruch neu
aufbaut, verdient sie wieder. Eine Serie bricht genau dann, wenn sie auch
Gesundheit kostet — bewertet mit `missedIntervalsFor()` aus `growth.ts`, damit
Münzen und Verwelken nicht auseinanderlaufen können.

Drei Regeln, die leicht reißen:

- **Ausgraben muss banken.** Das Verdiente folgt aus der Gießhistorie, und die
  verschwindet beim Ausgraben. `uprootPlant()` schreibt die Münzen der Pflanze
  vorher in `bankedCoins` — sonst könnte das Guthaben negativ werden.
- **Der bezahlte Preis wird mitgespeichert.** Eine spätere Umstellung der
  Preistabelle darf bestehende Guthaben nicht rückwirkend verschieben.
- **Kaufen ist eine Transaktion** über `plants` *und* `settings`. Das Guthaben
  muss mitgelesen werden, weil es abgeleitet ist; ohne Transaktion buchen zwei
  schnelle Taps zweimal ab.

Freigeschaltet ist, was Startart ist, gekauft wurde **oder wovon eine Pflanze
existiert**. Der letzte Fall ist Notwehr gegen importierte Sicherungen: eine
wachsende Pflanze darf nie als gesperrt gelten.

Die Auslegung steht in `src/config/economy.ts` und ist in
`src/lib/coins.test.ts` als Zahlen festgeschrieben — vier tägliche Gewohnheiten,
konsequent gegossen, ergeben 48 Münzen am Tag 7, 280 am Tag 30, 600 am Tag 60
und 1160 am Tag 100. Alle 24 käuflichen Arten kosten zusammen 2455. Wer an den
Boni dreht, sieht in diesen Tests sofort, was es mit dem Tempo macht.

Stand: Phase 5 abgeschlossen. Alle fünf Screens sind bedienbar, dazu Dark Mode,
Begrüßung beim ersten Start, 30 Arten mit der neu gebauten Illustration, der
Samenladen und die Münzwirtschaft.

---

## Konventionen

- **Code auf Englisch.** Kommentare, Testbeschreibungen, Log-Ausgaben und
  Fehlermeldungen sind englisch — auch in `.github/workflows/` und `index.html`.
  Deutsch bleibt an genau drei Stellen: die sichtbaren Texte in
  `src/i18n/de.ts`, die App-Beschreibung in `vite.config.ts` und `index.html`
  (Manifest und Meta-Tag, beide für Nutzer sichtbar) sowie diese Dokumentation
  samt `thoughts/` und `learnings/`.
- Kein `var`. `const` als Standard, `let` nur wenn nötig.
- Arrow Functions für Callbacks, Array-Methoden und Komponenten.
- Template Literals statt String-Konkatenation, `?.` und `??` wo passend.
- `async/await` statt `.then()`-Ketten.
- Eine Verantwortung pro Datei, Dateien klein halten.
- Import-Gruppen: externe Pakete → interne Module → Styles.
- Konstanten und Konfigurationswerte nach oben bzw. nach `src/config/`, nie
  inline. Keine magischen Zahlen.
- Keine unbenutzten Variablen oder Imports (`noUnusedLocals` ist an).
- Kein auskommentierter, toter Code.

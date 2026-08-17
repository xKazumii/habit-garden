# Habit Garden

Ein digitaler Garten für Gewohnheiten. Für jede Gewohnheit pflanzt man eine
Pflanze. Erledigt man die Gewohnheit, gießt man die Pflanze und sie wächst.
Vernachlässigt man sie, welkt sie und geht irgendwann ein.

Installierbare PWA, läuft offline. **Alle Daten bleiben lokal im Browser** — es
gibt kein Backend, kein Konto und keine Synchronisierung. Deshalb ist der
Export in den Einstellungen die einzige Sicherung.

👉 https://xkazumii.github.io/habit-garden/

## Entwickeln

Node ≥ 22.12 (siehe `.nvmrc`):

```bash
nvm use
npm install
npm run dev
```

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Dev-Server |
| `npm test` | Tests der Wachstumslogik |
| `npm run test:watch` | Tests im Watch-Modus |
| `npm run typecheck` | Typprüfung |
| `npm run build` | Produktions-Build nach `dist/` |
| `npm run preview` | `dist/` ausliefern, inklusive Base-Path |
| `npm run icons` | Favicon und PWA-Icons neu erzeugen |

## Deployment

Jeder Push auf `main` baut und deployt über GitHub Actions
(`.github/workflows/deploy.yml`). Der Workflow läuft nur durch, wenn Tests und
Typecheck grün sind.

**Einmalig nötig:** in GitHub unter *Settings → Pages → Source* auf
**GitHub Actions** stellen.

Weil die App unter einem Unterpfad liegt, müssen `base` in `vite.config.ts`
sowie `start_url` und `scope` im Manifest alle `/habit-garden/` sein. Details
und die vollständigen Wachstumsregeln stehen in [`CLAUDE.md`](./CLAUDE.md).

## Aufbau

- `src/lib/growth.ts` — Wachstums- und Verwelklogik, UI-frei und getestet
- `src/lib/time.ts` — Kalendertag-Arithmetik (sommerzeit- und zeitzonensicher)
- `src/db/` — Dexie-Schema und Repository
- `src/config/` — Konstanten der Wachstumsregeln, Kategorien und Arten
- `src/i18n/` — alle sichtbaren Texte

# Vite-PWA auf GitHub Pages

## Base-Path muss an vier Stellen stimmen

**Datum:** 2026-08-17
**Kontext:** Habit Garden als Project Page unter
`https://xkazumii.github.io/habit-garden/` aufsetzen.

**Learning:** Ein Unterpfad-Deployment bricht an mehr Stellen als nur `base`.
Es müssen alle vier übereinstimmen:

1. `base: '/habit-garden/'` in `vite.config.ts`
2. `manifest.start_url`
3. `manifest.scope`
4. `workbox.navigateFallback` → `'/habit-garden/index.html'`

Die Icon-Pfade im Manifest bekommen den Base-Path **nicht** automatisch
vorangestellt. Lösung: relativ angeben (`icons/icon-192.png`). Manifest-URLs
werden per Spec gegen die URL der `manifest.webmanifest` aufgelöst, und die
liegt bereits unter dem Base-Path. Damit ist der Pfad zugleich austauschbar,
falls das Repo mal umbenannt wird.

Prüfen lässt sich das nach dem Build ohne Deployment:

```bash
cat dist/index.html dist/manifest.webmanifest dist/registerSW.js
```

In `registerSW.js` müssen `register('/habit-garden/sw.js')` und
`{ scope: '/habit-garden/' }` stehen. Steht dort `/sw.js`, findet der Browser
den Service Worker auf Pages nicht und die App ist nicht installierbar.

**Warum es wichtig ist:** Der Fehler zeigt sich erst nach dem Deployment als
weiße Seite oder als „nicht installierbar", und ein falscher SW-Scope wird
aggressiv gecacht — Debuggen dauert dann deutlich länger als die Prüfung vorher.

---

## Vite 8 verlangt neueres Node als das lokal aktive

**Datum:** 2026-08-17
**Kontext:** `npm install` mit lokal aktivem Node v20.17.0.

**Learning:** Vite 7 und 8 verlangen `^20.19.0 || >=22.12.0`. Node 20.17 und
auch 22.7 fallen durch — 22.7 sieht „neu genug" aus, ist aber kleiner als
22.12. Vor dem Aufsetzen also nicht nur die Major-Version prüfen:

```bash
node -v
npm view vite@latest engines
```

`.nvmrc` mit `22` ins Repo legen und in der CI `node-version-file: .nvmrc`
verwenden, damit lokal und CI nicht auseinanderlaufen.

**Warum es wichtig ist:** Die Engine-Warnung von npm ist leicht zu übersehen;
der Build scheitert dann später mit einer Fehlermeldung, die nicht nach
Node-Version aussieht.

---

## Tailwind 4: `@theme inline` für Themes zur Laufzeit

**Datum:** 2026-08-17
**Kontext:** Dark Mode als CSS-Variablen vorbereiten, ohne ihn schon zu aktivieren.

**Learning:** In Tailwind 4 **kopiert** `@theme { --color-x: var(--my-var) }` den
Wert in die generierten Utilities — ein späterer Wechsel von `--my-var` wirkt
dann nicht. Mit `@theme inline { … }` referenzieren die Utilities die Variable,
und ein Theme-Wechsel zur Laufzeit (`[data-theme="dark"]` auf `<html>`) greift
sofort.

Muster: Palette in `:root` und `[data-theme="dark"]` als eigene Variablen
definieren, danach in `@theme inline` nur noch darauf zeigen.

Eigene Utilities gehen in Tailwind 4 über `@utility name { … }`, nicht mehr über
`@layer utilities`.

**Warum es wichtig ist:** Ohne `inline` sieht im Build alles korrekt aus, aber
der Theme-Umschalter tut später nichts — und die Ursache liegt weit weg von der
Stelle, an der man sucht.

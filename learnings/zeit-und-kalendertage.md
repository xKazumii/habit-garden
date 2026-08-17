# Zeit, Kalendertage und Tests

## Kalendertage statt 24-Stunden-Fenster

**Datum:** 2026-08-17
**Kontext:** Fälligkeit von Gewohnheiten in Habit Garden.

**Learning:** „Täglich" bedeutet bei Gewohnheiten *einmal pro Kalendertag*, nicht
*alle 24 Stunden*. Mit 24h-Arithmetik driftet die Fälligkeit: wer um 23:50
abhakt, ist am nächsten Tag erst um 23:50 wieder dran, und wer dann um 23:40
abhaken will, kommt „zu früh" und verliert den Tag.

Robuste Umsetzung — Tagesindex aus den **lokalen Kalenderfeldern**:

```ts
const dayNumber = (timestamp: number): number => {
  const date = new Date(timestamp)
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000)
}
```

Nicht `timestamp / 86400000` (das ergibt UTC-Tage, die in Zonen mit großem
Offset auf den falschen lokalen Tag zeigen) und nicht `+ n * 86400000` (bricht an
Sommerzeitgrenzen). Für „Mitternacht in n Tagen" `setHours(0,0,0,0)` plus
`setDate(getDate() + n)` verwenden — beides rechnet über Kalenderfelder.

**Warum es wichtig ist:** Beide Fehler sind unsichtbar, solange man in
Europe/Berlin um die Mittagszeit testet. Sie treten beim Nutzer auf: abends kurz
vor Mitternacht, nach einer Zeitumstellung oder auf Reisen.

---

## Zeitzonen in Vitest umstellen

**Datum:** 2026-08-17
**Kontext:** Tests für Zeitzonenwechsel und Sommerzeit.

**Learning:** Node liest `process.env.TZ` bei **jeder Zuweisung** neu ein. Damit
lassen sich mehrere Zonen in einem Testlauf prüfen:

```ts
const withTimeZone = <T>(timeZone: string, run: () => T): T => {
  const previous = process.env.TZ
  process.env.TZ = timeZone
  try {
    return run()
  } finally {
    if (previous === undefined) delete process.env.TZ
    else process.env.TZ = previous
  }
}
```

Dazu in `vitest.config.ts` eine feste Ausgangszone setzen, damit die Tests nicht
von der Maschine abhängen:

```ts
test: { env: { TZ: 'Europe/Berlin' } }
```

`process` typisieren: in einem Vite-Projekt steht `@types/node` nicht
automatisch im App-tsconfig. Entweder `"types": ["vite/client", "node"]`
ergänzen oder ein eigenes tsconfig für Tests anlegen.

Nützliche echte Datumswerte:

- EU-Sommerzeit 2026: Beginn 29.03. (23-Stunden-Tag), Ende 25.10. (25 Stunden)
- US-Sommerzeit 2026: Beginn 08.03. — deshalb ist New York am 10.03. UTC−4, nicht −5
- `Asia/Kolkata` für einen halbstündigen Offset, `Pacific/Auckland` und
  `Pacific/Kiritimati` für große positive Offsets

**Warum es wichtig ist:** Ohne feste Ausgangszone laufen solche Tests lokal grün
und in der CI (UTC) rot — oder umgekehrt.

---

## `-0` als Testfalle

**Datum:** 2026-08-17
**Kontext:** `daysUntilDue: -daysOverdue` in der Wachstumslogik.

**Learning:** `-0` ist in JavaScript nicht `0`, wenn mit `Object.is` verglichen
wird — und genau das nutzt `expect(...).toBe(...)`. Die Fehlermeldung lautet
dann `expected -0 to be +0`.

Fix nicht im Test, sondern in der Quelle: statt `-x` eine echte Differenz
berechnen (`dueDay - today`). Dann entsteht `-0` gar nicht.

**Warum es wichtig ist:** Man neigt dazu, den Test auf `toEqual` oder
`toBeCloseTo` aufzuweichen. Dabei bleibt das `-0` in den Daten und taucht später
in Formatierungen und Vergleichen wieder auf.

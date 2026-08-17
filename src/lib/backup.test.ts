import { describe, expect, it } from 'vitest'

import { MAX_INTERVAL_DAYS, MIN_INTERVAL_DAYS } from '../config/growth'
import type { Plant } from '../types'
import { BACKUP_APP, backupFileName, createBackup, parseBackup } from './backup'

const JUNE_1 = new Date(2026, 5, 1, 9).getTime()
const JUNE_2 = new Date(2026, 5, 2, 9).getTime()

const makePlant = (overrides: Partial<Plant> = {}): Plant => ({
  id: 'p1',
  category: 'herb',
  species: 'basil',
  habitName: 'Morgens zwei Gläser Wasser',
  intervalDays: 1,
  createdAt: JUNE_1,
  lastWateredAt: JUNE_2,
  waterings: [JUNE_1, JUNE_2],
  growthPoints: 2,
  status: 'alive',
  ...overrides,
})

/** Sicherung mit beliebigem Inhalt, wie sie aus einer Datei käme. */
const backupWith = (plants: unknown[]): string =>
  JSON.stringify({ app: BACKUP_APP, version: 1, exportedAt: JUNE_2, plants })

describe('createBackup', () => {
  it('umschließt die Pflanzen mit App-Kennung und Zeitstempel', () => {
    const backup = createBackup([makePlant()], 'Fenja', JUNE_2)

    expect(backup.app).toBe(BACKUP_APP)
    expect(backup.exportedAt).toBe(JUNE_2)
    expect(backup.plants).toHaveLength(1)
    expect(backup.settings).toEqual({ gardenerName: 'Fenja' })
  })

  it('kopiert die Liste, statt sie zu verlinken', () => {
    const plants = [makePlant()]
    const backup = createBackup(plants, '', JUNE_2)

    plants.push(makePlant({ id: 'p2' }))
    expect(backup.plants).toHaveLength(1)
  })
})

describe('backupFileName', () => {
  it('enthält das lokale Datum', () => {
    expect(backupFileName(new Date(2026, 7, 9, 23, 30).getTime())).toBe('habit-garden-2026-08-09.json')
  })
})

describe('parseBackup', () => {
  it('liest eine selbst erzeugte Sicherung verlustfrei', () => {
    const plant = makePlant()
    const raw = JSON.stringify(createBackup([plant], 'Fenja', JUNE_2))

    expect(parseBackup(raw)).toEqual({ plants: [plant], skipped: 0, gardenerName: 'Fenja' })
  })

  it('weist alles zurück, was keine Sicherung dieser App ist', () => {
    expect(parseBackup('kein json')).toBeNull()
    expect(parseBackup('null')).toBeNull()
    expect(parseBackup('[]')).toBeNull()
    expect(parseBackup(JSON.stringify({ app: 'etwas-anderes', plants: [] }))).toBeNull()
    expect(parseBackup(JSON.stringify({ app: BACKUP_APP }))).toBeNull()
  })

  it('überspringt kaputte Datensätze, statt den Import zu kippen', () => {
    const raw = backupWith([
      makePlant(),
      null,
      { id: 'ohne-alles' },
      makePlant({ id: 'p2', habitName: '   ' }),
      makePlant({ id: 'p3' }),
    ])

    const result = parseBackup(raw)
    expect(result?.plants.map((plant) => plant.id)).toEqual(['p1', 'p3'])
    expect(result?.skipped).toBe(3)
  })

  it('weist unbekannte Arten ab', () => {
    const result = parseBackup(backupWith([makePlant({ species: 'drachenbaum' })]))

    expect(result?.plants).toHaveLength(0)
    expect(result?.skipped).toBe(1)
  })

  it('nimmt die Kategorie aus der Artdefinition, nicht aus der Datei', () => {
    const result = parseBackup(backupWith([makePlant({ species: 'oak', category: 'herb' })]))

    expect(result?.plants[0]?.category).toBe('tree')
  })

  it('klemmt das Intervall in die erlaubten Grenzen', () => {
    const result = parseBackup(
      backupWith([
        makePlant({ id: 'zu-klein', intervalDays: 0 }),
        makePlant({ id: 'zu-gross', intervalDays: 999 }),
      ]),
    )

    expect(result?.plants[0]?.intervalDays).toBe(MIN_INTERVAL_DAYS)
    expect(result?.plants[1]?.intervalDays).toBe(MAX_INTERVAL_DAYS)
  })

  it('leitet fehlende Felder aus den Gießvorgängen ab', () => {
    const raw = backupWith([
      {
        id: 'p1',
        species: 'basil',
        habitName: 'Lesen',
        createdAt: JUNE_1,
        waterings: [JUNE_2, JUNE_1],
      },
    ])

    const plant = parseBackup(raw)?.plants[0]
    expect(plant?.waterings).toEqual([JUNE_1, JUNE_2])
    expect(plant?.lastWateredAt).toBe(JUNE_2)
    expect(plant?.growthPoints).toBe(2)
    expect(plant?.status).toBe('alive')
  })

  it('behält einen eingetragenen Tod', () => {
    const result = parseBackup(backupWith([makePlant({ status: 'dead' })]))

    expect(result?.plants[0]?.status).toBe('dead')
  })

  it('wirft unbrauchbare Zeitstempel aus den Gießvorgängen', () => {
    const raw = backupWith([makePlant({ waterings: [JUNE_1, Number.NaN, JUNE_2] as number[] })])

    expect(parseBackup(raw)?.plants[0]?.waterings).toEqual([JUNE_1, JUNE_2])
  })

  describe('Name', () => {
    const withSettings = (settings: unknown): string =>
      JSON.stringify({ app: BACKUP_APP, version: 1, exportedAt: JUNE_2, plants: [], settings })

    it('liest den Namen aus der Sicherung', () => {
      expect(parseBackup(withSettings({ gardenerName: '  Fenja  ' }))?.gardenerName).toBe('Fenja')
    })

    it('ist null, wenn die Datei keinen Namen mitbringt', () => {
      expect(parseBackup(backupWith([]))?.gardenerName).toBeNull()
    })

    it('wertet einen leeren Namen als nicht vorhanden', () => {
      // Sonst würde eine alte Sicherung einen gesetzten Namen wieder löschen.
      expect(parseBackup(withSettings({ gardenerName: '   ' }))?.gardenerName).toBeNull()
    })

    it('ignoriert kaputte Einstellungen, statt den Import zu kippen', () => {
      expect(parseBackup(withSettings(null))?.gardenerName).toBeNull()
      expect(parseBackup(withSettings('Fenja'))?.gardenerName).toBeNull()
      expect(parseBackup(withSettings({ gardenerName: 42 }))?.gardenerName).toBeNull()
    })
  })
})

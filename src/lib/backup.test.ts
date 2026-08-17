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

/** A backup with arbitrary content, as it would come from a file. */
const backupWith = (plants: unknown[]): string =>
  JSON.stringify({ app: BACKUP_APP, version: 1, exportedAt: JUNE_2, plants })

describe('createBackup', () => {
  it('wraps the plants with an app marker and a timestamp', () => {
    const backup = createBackup([makePlant()], 'Fenja', JUNE_2)

    expect(backup.app).toBe(BACKUP_APP)
    expect(backup.exportedAt).toBe(JUNE_2)
    expect(backup.plants).toHaveLength(1)
    expect(backup.settings).toEqual({ gardenerName: 'Fenja' })
  })

  it('copies the list instead of linking it', () => {
    const plants = [makePlant()]
    const backup = createBackup(plants, '', JUNE_2)

    plants.push(makePlant({ id: 'p2' }))
    expect(backup.plants).toHaveLength(1)
  })
})

describe('backupFileName', () => {
  it('contains the local date', () => {
    expect(backupFileName(new Date(2026, 7, 9, 23, 30).getTime())).toBe('habit-garden-2026-08-09.json')
  })
})

describe('parseBackup', () => {
  it('reads back a backup it created without loss', () => {
    const plant = makePlant()
    const raw = JSON.stringify(createBackup([plant], 'Fenja', JUNE_2))

    expect(parseBackup(raw)).toEqual({ plants: [plant], skipped: 0, gardenerName: 'Fenja' })
  })

  it('rejects anything that is not a backup of this app', () => {
    expect(parseBackup('not json')).toBeNull()
    expect(parseBackup('null')).toBeNull()
    expect(parseBackup('[]')).toBeNull()
    expect(parseBackup(JSON.stringify({ app: 'etwas-anderes', plants: [] }))).toBeNull()
    expect(parseBackup(JSON.stringify({ app: BACKUP_APP }))).toBeNull()
  })

  it('skips broken records instead of sinking the import', () => {
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

  it('rejects unknown species', () => {
    const result = parseBackup(backupWith([makePlant({ species: 'drachenbaum' })]))

    expect(result?.plants).toHaveLength(0)
    expect(result?.skipped).toBe(1)
  })

  it('takes the category from the species definition, not from the file', () => {
    const result = parseBackup(backupWith([makePlant({ species: 'oak', category: 'herb' })]))

    expect(result?.plants[0]?.category).toBe('tree')
  })

  it('clamps the interval into the allowed bounds', () => {
    const result = parseBackup(
      backupWith([
        makePlant({ id: 'zu-klein', intervalDays: 0 }),
        makePlant({ id: 'zu-gross', intervalDays: 999 }),
      ]),
    )

    expect(result?.plants[0]?.intervalDays).toBe(MIN_INTERVAL_DAYS)
    expect(result?.plants[1]?.intervalDays).toBe(MAX_INTERVAL_DAYS)
  })

  it('derives missing fields from the waterings', () => {
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

  it('keeps a recorded death', () => {
    const result = parseBackup(backupWith([makePlant({ status: 'dead' })]))

    expect(result?.plants[0]?.status).toBe('dead')
  })

  it('drops unusable timestamps from the waterings', () => {
    const raw = backupWith([makePlant({ waterings: [JUNE_1, Number.NaN, JUNE_2] as number[] })])

    expect(parseBackup(raw)?.plants[0]?.waterings).toEqual([JUNE_1, JUNE_2])
  })

  describe('Name', () => {
    const withSettings = (settings: unknown): string =>
      JSON.stringify({ app: BACKUP_APP, version: 1, exportedAt: JUNE_2, plants: [], settings })

    it('reads the name from the backup', () => {
      expect(parseBackup(withSettings({ gardenerName: '  Fenja  ' }))?.gardenerName).toBe('Fenja')
    })

    it('is null when the file carries no name', () => {
      expect(parseBackup(backupWith([]))?.gardenerName).toBeNull()
    })

    it('treats an empty name as absent', () => {
      // Otherwise an old backup would wipe a name that is already set.
      expect(parseBackup(withSettings({ gardenerName: '   ' }))?.gardenerName).toBeNull()
    })

    it('ignores broken settings instead of sinking the import', () => {
      expect(parseBackup(withSettings(null))?.gardenerName).toBeNull()
      expect(parseBackup(withSettings('Fenja'))?.gardenerName).toBeNull()
      expect(parseBackup(withSettings({ gardenerName: 42 }))?.gardenerName).toBeNull()
    })
  })
})

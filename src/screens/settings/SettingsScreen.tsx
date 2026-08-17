import { useRef, useState, type ChangeEvent, type ComponentType } from 'react'

import { DownloadIcon, UploadIcon, type IconProps } from '../../components/icons'
import { importPlants } from '../../db/plants'
import { saveGardenerName } from '../../db/settings'
import type { ThemeControl } from '../../hooks/useTheme'
import { t, tCount } from '../../i18n'
import { backupFileName, createBackup, parseBackup } from '../../lib/backup'
import type { GardenSettings, Plant } from '../../types'
import { AppearanceSection } from './AppearanceSection'
import { NameSection } from './NameSection'

/**
 * Settings: appearance, name and the backup.
 *
 * Without an account and without a server the export is the only way to keep the
 * garden — which is why the note about it lives on the same screen.
 */

const JSON_MIME = 'application/json'
const FILE_ACCEPT = 'application/json,.json'
const ICON_SIZE = 20

type NoticeTone = 'ok' | 'error'

interface Notice {
  tone: NoticeTone
  text: string
}

const NOTICE_CLASS: Readonly<Record<NoticeTone, string>> = {
  ok: 'bg-primary-soft text-primary-strong',
  error: 'bg-accent-soft text-accent',
}

interface ActionRowProps {
  icon: ComponentType<IconProps>
  label: string
  hint: string
  onClick: () => void
}

const ActionRow = ({ icon: Icon, label, hint, onClick }: ActionRowProps) => (
  <button
    type="button"
    onClick={onClick}
    className="bg-surface shadow-card flex w-full items-center gap-3.5 rounded-lg px-4.5 py-4 text-left"
  >
    <span className="bg-primary-soft text-primary flex h-10 w-10 flex-none items-center justify-center rounded-sm">
      <Icon size={ICON_SIZE} />
    </span>
    <span className="flex flex-col gap-0.5">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-muted text-xs leading-snug">{hint}</span>
    </span>
  </button>
)

interface SettingsScreenProps {
  plants: readonly Plant[]
  settings: GardenSettings
  theme: ThemeControl
}

export const SettingsScreen = ({ plants, settings, theme }: SettingsScreenProps) => {
  const fileInput = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  /* An import can bring a name along — the field then has to remount. */
  const [nameFieldKey, setNameFieldKey] = useState(0)

  const exportPlants = () => {
    if (plants.length === 0) {
      setNotice({ tone: 'error', text: t('settings.export.empty') })
      return
    }

    const now = Date.now()
    const backup = createBackup(plants, settings.gardenerName, now)
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: JSON_MIME })
    const url = URL.createObjectURL(blob)

    try {
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = backupFileName(now)
      anchor.click()
      setNotice({ tone: 'ok', text: t('settings.export.done') })
    } catch (error: unknown) {
      console.error('[backup] Export failed', error)
      setNotice({ tone: 'error', text: t('settings.export.failed') })
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  const onFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Reset, otherwise picking the same file again fires no change event.
    event.target.value = ''
    if (!file) return

    try {
      const parsed = parseBackup(await file.text())
      if (!parsed) {
        setNotice({ tone: 'error', text: t('settings.import.failed') })
        return
      }

      const count = await importPlants(parsed.plants)

      if (parsed.gardenerName !== null) {
        await saveGardenerName(parsed.gardenerName)
        setNameFieldKey((key) => key + 1)
      }

      const done = tCount('settings.import.done', count)
      const skipped =
        parsed.skipped > 0 ? ` ${tCount('settings.import.skipped', parsed.skipped)}` : ''
      setNotice({ tone: parsed.skipped > 0 ? 'error' : 'ok', text: `${done}${skipped}` })
    } catch (error: unknown) {
      console.error('[backup] Import failed', error)
      setNotice({ tone: 'error', text: t('settings.import.failed') })
    }
  }

  return (
    <div className="animate-enter flex flex-col gap-6 px-5.5 pt-3.5 pb-7.5">
      <h1 className="px-0.5 text-[25px] leading-tight font-semibold tracking-tight">
        {t('settings.title')}
      </h1>

      <AppearanceSection theme={theme} />

      <NameSection key={nameFieldKey} initialName={settings.gardenerName} />

      <section>
        <h2 className="text-muted px-0.5 pb-2.5 text-[11px] tracking-[0.08em] uppercase">
          {t('settings.dataTitle')}
        </h2>

        <div className="flex flex-col gap-2">
          <ActionRow
            icon={DownloadIcon}
            label={t('settings.export.label')}
            hint={t('settings.export.hint')}
            onClick={exportPlants}
          />
          <ActionRow
            icon={UploadIcon}
            label={t('settings.import.label')}
            hint={t('settings.import.hint')}
            onClick={() => fileInput.current?.click()}
          />
        </div>

        <input
          ref={fileInput}
          type="file"
          accept={FILE_ACCEPT}
          onChange={(event) => void onFileChosen(event)}
          className="hidden"
        />

        {notice && (
          <p
            role="status"
            className={`animate-enter mt-3 rounded-md px-4 py-3 text-[13px] leading-snug ${NOTICE_CLASS[notice.tone]}`}
          >
            {notice.text}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div className="bg-surface shadow-card flex flex-col gap-1.5 rounded-lg px-4.5 py-4">
          <h2 className="text-sm font-medium">{t('settings.storageTitle')}</h2>
          <p className="text-muted text-xs leading-relaxed">{t('settings.storageBody')}</p>
        </div>

        <div className="bg-surface shadow-card flex flex-col gap-1.5 rounded-lg px-4.5 py-4">
          <h2 className="text-sm font-medium">{t('settings.aboutTitle')}</h2>
          <p className="text-muted text-xs leading-relaxed">{t('settings.aboutBody')}</p>
        </div>
      </section>

      <p className="text-muted px-1.5 text-xs">
        {t('app.name')} · {t('settings.version', { version: __APP_VERSION__ })}
      </p>
    </div>
  )
}

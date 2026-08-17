import { useId, useState } from 'react'

import { MAX_GARDENER_NAME_LENGTH } from '../../config/settings'
import { saveGardenerName } from '../../db/settings'
import { t } from '../../i18n'

/**
 * Der Name im Gruß. Speichert bei jeder Eingabe — kein Speichern-Knopf, der
 * sich vergessen lässt. Das Feld hält seinen eigenen Zustand, damit der
 * Rückweg über IndexedDB den Cursor nicht verschiebt.
 */

interface NameSectionProps {
  initialName: string
}

export const NameSection = ({ initialName }: NameSectionProps) => {
  const fieldId = useId()
  const [name, setName] = useState(initialName)

  const onChange = (value: string) => {
    setName(value)
    void saveGardenerName(value).catch((error: unknown) => {
      console.error('[db] Name speichern fehlgeschlagen', error)
    })
  }

  return (
    <section>
      <h2 className="text-muted px-0.5 pb-2.5 text-[11px] tracking-[0.08em] uppercase">
        {t('settings.nameTitle')}
      </h2>

      <div className="bg-surface shadow-card flex flex-col gap-2.5 rounded-lg px-4.5 py-4">
        <label htmlFor={fieldId} className="text-sm font-medium">
          {t('settings.name.label')}
        </label>
        <input
          id={fieldId}
          type="text"
          value={name}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('settings.name.placeholder')}
          maxLength={MAX_GARDENER_NAME_LENGTH}
          autoComplete="given-name"
          className="bg-canvas text-ink placeholder:text-muted w-full rounded-md px-4 py-3 text-sm outline-none"
        />
        <span className="text-muted text-xs leading-snug">{t('settings.name.hint')}</span>
      </div>
    </section>
  )
}

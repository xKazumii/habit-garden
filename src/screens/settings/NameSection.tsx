import { useState } from 'react'

import { TextField } from '../../components/TextField'
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

      <div className="bg-surface shadow-card rounded-lg px-4.5 py-4">
        <TextField
          label={t('settings.name.label')}
          value={name}
          onChange={onChange}
          placeholder={t('settings.name.placeholder')}
          hint={t('settings.name.hint')}
          maxLength={MAX_GARDENER_NAME_LENGTH}
          autoComplete="given-name"
          tone="inset"
        />
      </div>
    </section>
  )
}

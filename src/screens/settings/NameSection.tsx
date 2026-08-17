import { useState } from 'react'

import { TextField } from '../../components/TextField'
import { MAX_GARDENER_NAME_LENGTH } from '../../config/settings'
import { saveGardenerName } from '../../db/settings'
import { t } from '../../i18n'

/**
 * The name used in the greeting. Saves on every keystroke — no save button that
 * can be forgotten. The field keeps its own state so the round trip through
 * IndexedDB does not move the cursor.
 */

interface NameSectionProps {
  initialName: string
}

export const NameSection = ({ initialName }: NameSectionProps) => {
  const [name, setName] = useState(initialName)

  const onChange = (value: string) => {
    setName(value)
    void saveGardenerName(value).catch((error: unknown) => {
      console.error('[db] Saving the name failed', error)
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

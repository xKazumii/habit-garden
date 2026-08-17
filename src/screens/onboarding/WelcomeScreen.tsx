import { useState, type KeyboardEvent } from 'react'

import { AppMark } from '../../components/AppMark'
import { PrimaryButton } from '../../components/PrimaryButton'
import { TextField } from '../../components/TextField'
import { MAX_GARDENER_NAME_LENGTH } from '../../config/settings'
import { t } from '../../i18n'

/**
 * The first start. Asks for a name and can be skipped — the app does not need
 * one, it simply greets without it.
 *
 * Shown only while `onboardedAt` is null. After that the route is through the
 * settings.
 */

const ENTER_KEY = 'Enter'

interface WelcomeScreenProps {
  /** An empty name means "skipped". */
  onDone: (name: string) => void
}

export const WelcomeScreen = ({ onDone }: WelcomeScreenProps) => {
  const [name, setName] = useState('')

  const canSubmit = name.trim().length > 0

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === ENTER_KEY && canSubmit) onDone(name)
  }

  return (
    <div className="pt-safe pb-safe-sheet animate-enter flex flex-1 flex-col justify-center gap-8 px-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <AppMark className="animate-pop shadow-lifted w-20 rounded-xl" />
        <h1 className="text-2xl leading-tight font-semibold tracking-tight">
          {t('onboarding.title')}
        </h1>
        <p className="text-muted text-sm leading-relaxed">{t('onboarding.body')}</p>
      </div>

      <TextField
        label={t('onboarding.nameLabel')}
        value={name}
        onChange={setName}
        onKeyDown={onKeyDown}
        placeholder={t('onboarding.namePlaceholder')}
        hint={t('onboarding.privacy')}
        maxLength={MAX_GARDENER_NAME_LENGTH}
        autoComplete="given-name"
      />

      <div className="flex flex-col items-center gap-2">
        <PrimaryButton onClick={() => onDone(name)} disabled={!canSubmit}>
          {t('onboarding.submit')}
        </PrimaryButton>
        <button
          type="button"
          onClick={() => onDone('')}
          className="text-muted px-4 py-2.5 text-[13px] font-medium"
        >
          {t('onboarding.skip')}
        </button>
      </div>
    </div>
  )
}

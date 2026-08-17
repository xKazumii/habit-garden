import { Pill } from '../../components/Pill'
import { THEME_PREFERENCES } from '../../config/theme'
import type { ThemeControl } from '../../hooks/useTheme'
import { t } from '../../i18n'

/**
 * Theme-Auswahl. „System" folgt der Geräteeinstellung, die beiden anderen
 * überstimmen sie fest.
 *
 * Die Chips sind eine exklusive Auswahl, tragen aber `aria-pressed` statt
 * Radio-Semantik — deshalb umschließt sie eine benannte Gruppe, damit klar ist,
 * dass sie zusammengehören.
 */

interface AppearanceSectionProps {
  theme: ThemeControl
}

export const AppearanceSection = ({ theme }: AppearanceSectionProps) => (
  <section>
    <h2 className="text-muted px-0.5 pb-2.5 text-[11px] tracking-[0.08em] uppercase">
      {t('settings.appearanceTitle')}
    </h2>

    <div className="bg-surface shadow-card flex flex-col gap-3 rounded-lg px-4.5 py-4">
      <span className="text-sm font-medium">{t('settings.theme.label')}</span>

      <div role="group" aria-label={t('settings.theme.label')} className="flex flex-wrap gap-2">
        {THEME_PREFERENCES.map((preference) => (
          <Pill
            key={preference}
            selected={theme.preference === preference}
            onClick={() => theme.setPreference(preference)}
          >
            {t(`theme.${preference}`)}
          </Pill>
        ))}
      </div>

      <span className="text-muted text-xs leading-snug">
        {t(`settings.theme.${theme.preference}Hint`)}
      </span>
    </div>
  </section>
)

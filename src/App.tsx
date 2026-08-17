import { AppMark } from './components/AppMark'
import { t } from './i18n'

/**
 * Phase 1: bewusst nur ein Platzhalter. Er belegt, dass Base-Path,
 * Design-Tokens, Schrift, Safe-Area-Insets und der Service Worker unter
 * GitHub Pages zusammenspielen. Die Screens folgen in Phase 2.
 */
export const App = () => (
  <div className="min-h-svh-safe pl-safe pr-safe flex flex-col">
    <main className="pt-safe flex flex-1 flex-col items-center justify-center gap-9 px-7 text-center">
      <AppMark className="animate-pop w-24 rounded-[22px] shadow-lifted" />

      <div className="animate-enter flex flex-col gap-2.5">
        <h1 className="text-3xl font-semibold tracking-tight">{t('app.name')}</h1>
        <p className="text-muted text-[15px]">{t('app.tagline')}</p>
      </div>

      <section className="animate-enter bg-surface shadow-card flex max-w-[19rem] flex-col gap-2 rounded-xl px-6 py-5">
        <h2 className="text-[15px] font-medium">{t('shell.seedingTitle')}</h2>
        <p className="text-muted text-[13px] leading-relaxed">{t('shell.seedingBody')}</p>
      </section>
    </main>

    <div className="pb-safe" />
  </div>
)

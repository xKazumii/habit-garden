import { t } from '../i18n'

/**
 * The reload an installed PWA does not otherwise have.
 *
 * Stays until it is used — unlike the coin reward it is not a moment but a
 * pending action. Sits above everything else, because a stale app is worth
 * interrupting for.
 */

interface UpdateBannerProps {
  onApply: () => void
  /** The reload is under way — the tap must be visibly acknowledged. */
  applying: boolean
}

export const UpdateBanner = ({ onApply, applying }: UpdateBannerProps) => (
  <div
    role="status"
    className="pt-safe absolute inset-x-0 top-0 z-50 flex justify-center px-4"
  >
    <div className="bg-surface shadow-lifted animate-pop mt-4 flex items-center gap-3 rounded-pill py-2 pr-2 pl-4">
      <span className="text-[13px] font-medium">{t('update.available')}</span>

      <button
        type="button"
        onClick={onApply}
        disabled={applying}
        className="bg-primary text-on-primary shadow-primary rounded-pill px-3.5 py-1.5 text-[13px] font-semibold transition active:scale-95 disabled:opacity-70"
      >
        {applying ? t('update.applying') : t('update.apply')}
      </button>
    </div>
  </div>
)

import { Coin } from '../../components/Coin'
import { COIN_SIZE } from '../../config/coin'
import { t, tCount } from '../../i18n'

/**
 * The balance in the garden header. Also the entrance to the seed shop — which is
 * why it is a button rather than a readout.
 */

interface CoinChipProps {
  balance: number
  onOpenShop: () => void
}

export const CoinChip = ({ balance, onOpenShop }: CoinChipProps) => (
  <button
    type="button"
    onClick={onOpenShop}
    aria-label={`${tCount('shop.balanceLabel', balance)} — ${t('shop.open')}`}
    className="bg-surface text-accent shadow-card flex h-11 flex-none items-center gap-1.5 rounded-md pr-3.5 pl-3 text-sm font-semibold"
  >
    <Coin size={COIN_SIZE.chip} />
    <span aria-hidden="true">{balance}</span>
  </button>
)

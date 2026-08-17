import { useEffect } from 'react'

import { COIN_SIZE } from '../config/coin'
import { t, tCount } from '../i18n'
import { Coin } from './Coin'

/**
 * The reward moment after watering: a coin pops in and spins.
 *
 * Deliberately small and floating above the content rather than a dialog — it
 * must not interrupt the flow. When a streak milestone is reached it grows and
 * names the run; that is the moment that counts.
 *
 * The duration matches the animation: two full turns of 900ms each, after which
 * the coin faces front again.
 */

const VISIBLE_MS = 1800

export interface CoinRewardState {
  coins: number
  /** The run that was reached. Only set when `milestone` is true. */
  streak: number
  /** More than the base coin was earned — a milestone was reached. */
  milestone: boolean
}

interface CoinRewardProps {
  reward: CoinRewardState
  onDone: () => void
}

export const CoinReward = ({ reward, onDone }: CoinRewardProps) => {
  useEffect(() => {
    const timer = window.setTimeout(onDone, VISIBLE_MS)
    return () => window.clearTimeout(timer)
  }, [reward, onDone])

  return (
    <div
      role="status"
      aria-live="polite"
      className="pt-safe pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center"
    >
      <div
        className={`animate-pop bg-surface shadow-lifted mt-4 flex items-center gap-2.5 rounded-pill ${
          reward.milestone ? 'px-5 py-3' : 'px-4 py-2.5'
        }`}
      >
        <Coin size={reward.milestone ? COIN_SIZE.reward : COIN_SIZE.chip} spinning />

        <span className="flex flex-col">
          <span
            className={`text-accent font-semibold ${reward.milestone ? 'text-[15px]' : 'text-sm'}`}
          >
            {tCount('reward.coins', reward.coins)}
          </span>

          {reward.milestone && reward.streak > 0 && (
            <span className="text-muted text-xs">
              {t('reward.streak', { count: reward.streak })}
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

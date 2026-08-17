import type { ComponentType } from 'react'

import { TAB_ORDER, type TabId } from '../config/tabs'
import { t } from '../i18n'
import { CalendarCheckIcon, GearIcon, SproutIcon, type IconProps } from './icons'

/**
 * Bottom Tab Bar. Kein Router — der aktive Tab ist State in `App`.
 */

const TAB_ICONS: Readonly<Record<TabId, ComponentType<IconProps>>> = {
  garden: SproutIcon,
  today: CalendarCheckIcon,
  settings: GearIcon,
}

interface TabBarProps {
  active: TabId
  onChange: (tab: TabId) => void
}

export const TabBar = ({ active, onChange }: TabBarProps) => (
  <nav
    aria-label={t('tabs.navLabel')}
    className="bg-nav shadow-nav pb-safe-nav grid flex-none grid-cols-3 px-3.5 pt-2 backdrop-blur-md"
  >
    {TAB_ORDER.map((tab) => {
      const Icon = TAB_ICONS[tab]
      const isActive = tab === active

      return (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          aria-current={isActive ? 'page' : undefined}
          className={`flex flex-col items-center gap-[5px] pt-2.5 pb-1 text-[10.5px] transition-[color,opacity] duration-200 ${
            isActive ? 'text-primary font-semibold' : 'text-muted font-normal opacity-70'
          }`}
        >
          <Icon />
          <span>{t(`tabs.${tab}`)}</span>
        </button>
      )
    })}
  </nav>
)

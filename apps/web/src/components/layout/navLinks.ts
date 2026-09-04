import type { TranslationKey } from '@/i18n'
import type { NavIconName } from './NavIcon'

interface NavLinkItem {
  to: string

  labelKey: TranslationKey

  icon: NavIconName
  end: boolean

  badge?: boolean
}


export const NAV_LINKS: readonly NavLinkItem[] = [
  { to: '/', labelKey: 'nav.home', icon: 'home', end: true },
  { to: '/friends', labelKey: 'nav.people', icon: 'people', end: false },
  { to: '/notifications', labelKey: 'nav.notifications', icon: 'notifications', end: false, badge: true },
  { to: '/profile', labelKey: 'nav.profile', icon: 'profile', end: false },
]

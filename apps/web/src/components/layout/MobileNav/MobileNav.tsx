import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { useUnreadCount } from '@/features/notifications/hooks'
import { NavIcon } from '../NavIcon'
import { NAV_LINKS } from '../navLinks'
import { UnreadBadge } from '../TopBar'

export function MobileNav() {
  const { t } = useI18n()
  const { data: unread = 0 } = useUnreadCount()

  return (
    <nav
      aria-label={t('nav.main')}
      className="sticky bottom-0 z-40 border-t border-line bg-app/90 backdrop-blur-md md:hidden"

      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-5xl">
        {NAV_LINKS.map(({ to, labelKey, icon, end, badge }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
                  isActive ? 'text-accent-text' : 'text-subtle hover:text-content',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {}
                  <span
                    className={cn(
                      'relative grid h-8 w-12 place-items-center rounded-full transition-colors',
                      isActive && 'bg-accent text-on-accent',
                    )}
                  >
                    <NavIcon name={icon} active={isActive} className="size-5" />
                    {badge ? <UnreadBadge count={unread} /> : null}
                  </span>
                  {t(labelKey)}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

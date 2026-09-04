import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, User as UserIcon } from 'lucide-react'
import { Avatar, DropdownMenu, MenuItem } from '@/components/ui'
import { Logo } from '@/components/brand/Logo'
import { useAuth } from '@/providers/auth-context'
import { useUnreadCount } from '@/features/notifications/hooks'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { LanguageToggle } from '../LanguageToggle'
import { ThemeToggle } from '../ThemeToggle'
import { NavIcon } from '../NavIcon'
import { NAV_LINKS } from '../navLinks'


export function UnreadBadge({ count }: { count: number }) {
  const { t } = useI18n()
  if (count <= 0) return null
  return (
    <span
      className={cn(
        'pointer-events-none absolute -end-2.5 -top-2 grid min-w-4 place-items-center',
        'rounded-full bg-accent px-1 text-[0.625rem] font-bold leading-4 text-on-accent',
      )}
      aria-label={t('nav.unread', { count })}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}

export function TopBar() {
  const { t } = useI18n()
  const { isAuthenticated, user, signOut } = useAuth()
  const { data: unread = 0 } = useUnreadCount()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-app/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link to="/" className="rounded-lg" aria-label={t('nav.echooHome')}>
          <Logo />
        </Link>

        {isAuthenticated && (
          <nav aria-label={t('nav.main')} className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map(({ to, labelKey, icon, end, badge }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        'relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',


                        isActive
                          ? 'bg-accent text-on-accent shadow-sm'
                          : 'text-muted hover:bg-surface-hover hover:text-content',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="relative">
                                <NavIcon name={icon} active={isActive} className="size-4" />
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
        )}

        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />

          {isAuthenticated ? (
            <DropdownMenu
              trigger={(props) => (
                <button
                  type="button"
                  aria-label={t('nav.accountMenu')}
                  className="ms-1 cursor-pointer rounded-full"
                  {...props}
                >
                  <Avatar src={user?.photo} name={user?.name ?? '?'} size="sm" />
                </button>
              )}
            >
              {(close) => (
                <>
                  <div className="border-b border-line px-3 py-2.5">
                    <p className="truncate text-sm font-medium text-content">
                      {user?.name ?? t('common.loading')}
                    </p>
                    <p className="truncate text-xs text-subtle">
                      {user ? `@${user.username}` : ''}
                    </p>
                  </div>
                  <div className="pt-1">
                    <MenuItem
                      onClick={() => {
                        close()
                        void navigate('/profile')
                      }}
                    >
                      <UserIcon className="size-4" aria-hidden="true" />
                      {t('nav.yourProfile')}
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        close()
                        signOut()
                      }}
                      destructive
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      {t('nav.signOut')}
                    </MenuItem>
                  </div>
                </>
              )}
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-content"
              >
                {t('nav.signIn')}
              </Link>
              <Link
                to="/register"
                className="rounded-lg border border-accent-border bg-accent px-3.5 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-[var(--on-accent)] focus-visible:outline-offset-0"
              >
                {t('nav.join')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

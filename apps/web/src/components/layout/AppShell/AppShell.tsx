import { Outlet } from 'react-router-dom'
import { useAuth } from '@/providers/auth-context'
import { MobileNav } from '../MobileNav'
import { TopBar } from '../TopBar'

export function AppShell() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand"
      >
        Skip to content
      </a>

      <TopBar />

      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      {isAuthenticated && <MobileNav />}
    </div>
  )
}

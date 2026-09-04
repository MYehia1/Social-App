import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/brand/Logo'
import { LanguageToggle } from '@/components/layout/LanguageToggle'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { useI18n } from '@/i18n'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const { t } = useI18n()

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-panel-from via-panel-via to-panel-to lg:block">
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          {}
          <Link to="/" className="w-fit rounded-lg" aria-label={t('nav.home')}>
            <Logo tone="on-dark" markClassName="size-8" className="gap-2.5" />
          </Link>

          <div className="max-w-md">
            <p className="text-2xl font-semibold leading-snug">{t('auth.tagline')}</p>
            <p className="mt-3 text-white/70">{t('auth.taglineSub')}</p>
          </div>

          {}
          <div aria-hidden="true" />
        </div>

        {}
        <div
          aria-hidden="true"
          className="absolute -start-20 -top-20 size-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -end-16 size-96 rounded-full bg-black/15 blur-3xl"
        />
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {}
          <div className="flex items-center justify-between gap-3">
            {}
            <Link to="/" className="inline-flex rounded-lg" aria-label={t('nav.home')}>
              <Logo />
            </Link>

            <div className="flex items-center gap-1">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-content">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>

          <div className="mt-7">{children}</div>

          <p className="mt-6 text-center text-sm text-muted">{footer}</p>
        </div>
      </div>
    </div>
  )
}

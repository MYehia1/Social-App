import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext, LOCALES, type Locale, type Translate } from './i18n-context'
import { ar } from './locales/ar'
import { en } from './locales/en'

const STORAGE_KEY = 'echoo.locale'

const DICTIONARIES: Record<Locale, Record<string, string>> = { en, ar }

function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'ar'
}


function initialLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
      void 0
    }

  for (const language of navigator.languages ?? [navigator.language]) {

    const base = language.split('-')[0]
    if (isLocale(base)) return base
  }
  return 'en'
}


function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const dir = LOCALES[locale].dir




  useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = LOCALES[locale].tag
  }, [dir, locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      void 0
    }
  }, [])

  const t = useCallback<Translate>(
    (key, vars) => {


      const value = DICTIONARIES[locale][key] ?? en[key]
      return interpolate(value, vars)
    },
    [locale],
  )

  const value = useMemo(() => ({ locale, dir, setLocale, t }), [locale, dir, setLocale, t])

  return <I18nContext value={value}>{children}</I18nContext>
}

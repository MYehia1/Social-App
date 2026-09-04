import { createContext, useContext } from 'react'
import type { TranslationKey } from './locales/en'

export type Locale = 'en' | 'ar'


export interface LocaleMeta {

  label: string
  dir: 'ltr' | 'rtl'

  tag: string
}

export const LOCALES: Record<Locale, LocaleMeta> = {
  en: { label: 'English', dir: 'ltr', tag: 'en' },
  ar: { label: 'العربية', dir: 'rtl', tag: 'ar' },
}

export type Translate = (
  key: TranslationKey,
  vars?: Record<string, string | number>,
) => string

export interface I18nContextValue {
  locale: Locale
  dir: 'ltr' | 'rtl'
  setLocale: (locale: Locale) => void
  t: Translate
}

export const I18nContext = createContext<I18nContextValue | null>(null)

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside <I18nProvider>')
  return context
}

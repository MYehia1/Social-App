import { Languages } from 'lucide-react'
import { DropdownMenu, MenuItem } from '@/components/ui'
import { LOCALES, useI18n, type Locale } from '@/i18n'

const ORDER: Locale[] = ['en', 'ar']

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n()

  return (
    <DropdownMenu
      trigger={(props) => (
        <button
          type="button"
          aria-label={t('language.label')}
          className="grid size-9 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-content"
          {...props}
        >
          <Languages className="size-[18px]" aria-hidden="true" />
        </button>
      )}
    >
      {(close) =>
        ORDER.map((value) => (
          <MenuItem
            key={value}
            onClick={() => {
              setLocale(value)
              close()
            }}
          >
            {}
            <span className="flex-1" lang={LOCALES[value].tag}>
              {LOCALES[value].label}
            </span>
            {locale === value && (
              <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
            )}
          </MenuItem>
        ))
      }
    </DropdownMenu>
  )
}

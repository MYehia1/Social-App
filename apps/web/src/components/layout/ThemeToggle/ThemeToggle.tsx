import { Monitor, Moon, Sun } from 'lucide-react'
import { DropdownMenu, MenuItem } from '@/components/ui'
import { useTheme, type Theme } from '@/providers/theme-context'
import { useI18n, type TranslationKey } from '@/i18n'

const options: Array<{ value: Theme; labelKey: TranslationKey; icon: typeof Sun }> = [
  { value: 'light', labelKey: 'theme.light', icon: Sun },
  { value: 'dark', labelKey: 'theme.dark', icon: Moon },
  { value: 'system', labelKey: 'theme.system', icon: Monitor },
]

export function ThemeToggle() {
  const { t } = useI18n()
  const { theme, resolved, setTheme } = useTheme()
  const Icon = resolved === 'dark' ? Moon : Sun

  return (
    <DropdownMenu
      trigger={(props) => (
        <button
          type="button"
          aria-label={t('theme.label', { theme: t(`theme.${theme}` as TranslationKey) })}
          className="grid size-9 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-content"
          {...props}
        >
          <Icon className="size-[18px]" aria-hidden="true" />
        </button>
      )}
    >
      {(close) =>
        options.map(({ value, labelKey, icon: OptionIcon }) => (
          <MenuItem
            key={value}
            onClick={() => {
              setTheme(value)
              close()
            }}
          >
            <OptionIcon className="size-4" aria-hidden="true" />
            <span className="flex-1">{t(labelKey)}</span>
            {theme === value && (
              <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
            )}
          </MenuItem>
        ))
      }
    </DropdownMenu>
  )
}

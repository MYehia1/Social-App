import { useEffect, useRef, useState } from 'react'
import { UserCheck } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/lib/api/users'
import { queryKeys } from '@/lib/queryKeys'
import { cn } from '@/lib/cn'
import { Avatar } from '@/components/ui'
import { useI18n } from '@/i18n'

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel: string
  rows?: number
  maxLength?: number
  className?: string

  singleLine?: boolean

  onSubmit?: () => void

  autoGrow?: boolean
}


function activeMention(text: string, caret: number): { term: string; start: number } | null {
  const upToCaret = text.slice(0, caret)
  const match = /(?:^|\s)@([a-z0-9_]{0,20})$/i.exec(upToCaret)
  if (!match) return null
  return { term: match[1] ?? '', start: caret - (match[1]?.length ?? 0) - 1 }
}


export function MentionInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  rows = 3,
  maxLength,
  className,
  singleLine = false,
  onSubmit,
  autoGrow = true,
}: MentionInputProps) {
  const { t } = useI18n()
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null)
  const [mention, setMention] = useState<{ term: string; start: number } | null>(null)
  const [highlight, setHighlight] = useState(0)

  const { data: matches = [] } = useQuery({
    queryKey: queryKeys.userSearch(mention?.term ?? ''),
    queryFn: () => usersApi.search(mention?.term ?? ''),


    enabled: mention !== null,
    staleTime: 30_000,
  })

  useEffect(() => setHighlight(0), [mention?.term])

  const open = Boolean(mention) && matches.length > 0

  function sync(element: HTMLTextAreaElement | HTMLInputElement) {
    setMention(activeMention(element.value, element.selectionStart ?? 0))
  }

  function insert(username: string) {
    if (!mention) return

    const before = value.slice(0, mention.start)
    const after = value.slice((ref.current?.selectionStart ?? mention.start) )
    const next = `${before}@${username} ${after}`

    onChange(next)
    setMention(null)


    requestAnimationFrame(() => {
      const element = ref.current
      if (!element) return
      const caret = before.length + username.length + 2
      element.focus()
      element.setSelectionRange(caret, caret)
    })
  }

  function onKeyDown(event: React.KeyboardEvent) {


    if (!open) {
      if (onSubmit && event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        onSubmit()
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight((index) => (index + 1) % matches.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((index) => (index - 1 + matches.length) % matches.length)
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      const chosen = matches[highlight]
      if (chosen) insert(chosen.username)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setMention(null)
    }
  }


  useEffect(() => {
    if (!autoGrow || singleLine) return
    const element = ref.current
    if (!element || !(element instanceof HTMLTextAreaElement)) return

    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`
  }, [value, autoGrow, singleLine])

  const shared = {
    ref: ref as never,
    value,
    placeholder,
    maxLength,
    'aria-label': ariaLabel,
    'aria-autocomplete': 'list' as const,
    'aria-expanded': open,
    onKeyDown,
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      onChange(event.target.value)
      sync(event.target)
    },
    onClick: (event: React.MouseEvent<HTMLTextAreaElement | HTMLInputElement>) =>
      sync(event.currentTarget),
    onBlur: () => {

      window.setTimeout(() => setMention(null), 150)
    },




    className: cn(
      'w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-content',


      'placeholder:text-subtle transition-colors hover:border-brand',
      'focus:border-focus focus-visible:outline-none focus-visible:shadow-none',
      !singleLine && 'resize-none',
      className,
    ),
  }

  return (
    <div className="relative w-full">
      {singleLine ? <input type="text" {...shared} /> : <textarea rows={rows} {...shared} />}

      {open && (
        <ul
          role="listbox"
          aria-label="People"
          className={cn(
            'absolute start-0 top-[calc(100%+0.25rem)] z-30 w-full max-w-xs overflow-hidden',
            'rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow-pop)]',
          )}
        >
          {matches.map((user, index) => (
            <li key={user.id}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlight}
                onMouseDown={(event) => {

                  event.preventDefault()
                  insert(user.username)
                }}
                onMouseEnter={() => setHighlight(index)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-start',
                  index === highlight && 'bg-surface-hover',
                )}
              >
                <Avatar src={user.photo} name={user.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-content">
                    {user.name}
                  </span>
                  <span className="block truncate text-xs text-subtle">
                    <bdi>@{user.username}</bdi>
                  </span>
                </span>
                {user.isFriend && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-1.5 py-0.5 text-[0.625rem] font-medium text-brand-text">
                    {}
                    <UserCheck className="size-3" aria-hidden="true" />
                    {t('mention.friend')}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

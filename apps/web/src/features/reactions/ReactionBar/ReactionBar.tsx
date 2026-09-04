import { useEffect, useRef, useState } from 'react'
import { ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/cn'
import { REACTION_TYPES, type Post, type ReactionType } from '@/types/api'
import { useToggleReaction } from '../hooks'
import { REACTION_META } from '../reactionMeta'
import { ReactionsDialog } from '../ReactionsDialog'
import { useI18n } from '@/i18n'


const CLOSE_DELAY_MS = 220

export function ReactionBar({ post }: { post: Post }) {
  const { t } = useI18n()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const closeTimer = useRef<number | undefined>(undefined)
  const toggle = useToggleReaction()

  const cancelClose = () => window.clearTimeout(closeTimer.current)
  const open = () => {
    cancelClose()
    setPickerOpen(true)
  }
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = window.setTimeout(() => setPickerOpen(false), CLOSE_DELAY_MS)
  }

  useEffect(() => cancelClose, [])

  const mine = post.myReaction
  const active = mine ? REACTION_META[mine] : null


  const top = (Object.entries(post.reactions) as Array<[ReactionType, number]>)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const react = (type: ReactionType) => {
    toggle.mutate({ postId: post.id, type })
    cancelClose()
    setPickerOpen(false)
  }

  return (
    <div className="flex items-center gap-1">
      <div
        className="relative"
        onMouseEnter={open}
        onMouseLeave={scheduleClose}

        onFocus={open}
        onBlur={scheduleClose}
      >
        <button
          type="button"
          onClick={() => react(mine ?? 'like')}
          aria-label={mine ? `Remove ${REACTION_META[mine].label}` : 'Like this post'}
          aria-pressed={Boolean(mine)}
          className={cn(
            'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5',
            'text-sm font-medium transition-colors',
            mine
              ? 'text-accent-text hover:bg-accent-soft'
              : 'text-muted hover:bg-surface-hover hover:text-content',
          )}
        >
          {active ? (
            <span aria-hidden="true" className="text-base leading-none">
              {active.emoji}
            </span>
          ) : (
            <ThumbsUp className="size-4" aria-hidden="true" />
          )}
          {active?.label ?? 'Like'}
        </button>

        {pickerOpen && (
          <div
            role="group"
            aria-label={t('reaction.choose')}


            className="absolute bottom-full start-0 z-20 pb-2"
          >
            <div className="flex gap-0.5 rounded-full border border-line bg-surface p-1 shadow-[var(--shadow-pop)]">
              {REACTION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => react(type)}
                  title={REACTION_META[type].label}
                  aria-label={REACTION_META[type].label}
                  aria-pressed={mine === type}
                  className={cn(
                    'grid size-9 cursor-pointer place-items-center rounded-full text-xl',
                    'transition-transform hover:scale-125 motion-reduce:hover:scale-100',
                    mine === type && 'bg-accent-soft',
                  )}
                >
                  <span aria-hidden="true">{REACTION_META[type].emoji}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {post.reactionTotal > 0 && (
        <>
          <button
            type="button"
            onClick={() => setListOpen(true)}
            aria-label={`See who reacted (${post.reactionTotal})`}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-1.5 py-1 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-content"
          >
            <span aria-hidden="true" className="flex -space-x-1">
              {top.map(([type]) => (
                <span
                  key={type}
                  className="grid size-5 place-items-center rounded-full bg-surface text-xs ring-1 ring-line"
                >
                  {REACTION_META[type].emoji}
                </span>
              ))}
            </span>
            <span className="tabular-nums">{post.reactionTotal}</span>
          </button>

          {listOpen && (
            <ReactionsDialog postId={post.id} open onClose={() => setListOpen(false)} />
          )}
        </>
      )}
    </div>
  )
}

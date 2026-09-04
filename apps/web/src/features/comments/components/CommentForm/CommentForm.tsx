import { useEffect, useRef, useState } from 'react'
import { SendHorizontal, X } from 'lucide-react'
import { Avatar, Spinner } from '@/components/ui'
import { MentionInput } from '@/components/MentionInput'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { useAuth } from '@/providers/auth-context'
import { useCreateComment } from '../../hooks'

const MAX_LENGTH = 300

const COUNTER_THRESHOLD = 60

interface CommentFormProps {
  postId: string

  parentId?: string
  replyingTo?: string
  onCancel?: () => void
  onDone?: () => void
  autoFocus?: boolean
}

export function CommentForm({
  postId,
  parentId,
  replyingTo,
  onCancel,
  onDone,
  autoFocus = false,
}: CommentFormProps) {
  const { t } = useI18n()
  const { user } = useAuth()

  const [content, setContent] = useState(replyingTo ? `@${replyingTo} ` : '')


  const [engaged, setEngaged] = useState(autoFocus)
  const containerRef = useRef<HTMLDivElement>(null)
  const createComment = useCreateComment()

  const trimmed = content.trim()
  const tooLong = trimmed.length > MAX_LENGTH
  const canSubmit = trimmed.length > 0 && !tooLong && !createComment.isPending
  const remaining = MAX_LENGTH - trimmed.length

  useEffect(() => {
    if (!autoFocus) return

    containerRef.current?.querySelector('textarea')?.focus()
  }, [autoFocus])

  function submit() {
    if (!canSubmit) return
    createComment.mutate(
      { content: trimmed, post: postId, ...(parentId ? { parent: parentId } : {}) },
      {
        onSuccess: () => {
          setContent('')
          onDone?.()
        },
      },
    )
  }

  return (
    <div ref={containerRef} className="flex items-start gap-2.5">
      <Avatar src={user?.photo} name={user?.name ?? '?'} size="sm" className="mt-0.5" />

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'rounded-xl border bg-surface transition-colors',








            tooLong
              ? 'border-danger'
              : 'border-line-strong has-[:focus-visible]:border-focus',
          )}
          onFocusCapture={() => setEngaged(true)}
        >
          {}
          <div className="flex items-end gap-1">
            <div className="min-w-0 flex-1">
              <MentionInput
                value={content}
                onChange={setContent}
                rows={1}
                placeholder={parentId ? t('comment.reply') : t('comment.write')}
                ariaLabel={parentId ? t('comment.replyLabel') : t('comment.writeLabel')}







                className="border-0 bg-transparent py-2 shadow-none focus:border-0 hover:border-0 focus-visible:outline-none focus-visible:shadow-none"
                onSubmit={submit}
              />
            </div>

            <div className="flex shrink-0 items-center gap-1 pb-1.5 pe-1.5">
              {remaining <= COUNTER_THRESHOLD && (
                <span
                  className={cn('text-xs tabular-nums', tooLong ? 'text-danger' : 'text-subtle')}
                  aria-live="polite"
                >
                  {remaining}
                </span>
              )}

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  aria-label={t('comment.cancelReply')}
                  className="grid size-8 cursor-pointer place-items-center rounded-lg text-subtle transition-colors hover:bg-surface-hover hover:text-content"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit}
                aria-label={parentId ? t('comment.sendReply') : t('comment.send')}
                className={cn(
                  'grid size-8 cursor-pointer place-items-center rounded-lg transition-colors',
                  canSubmit
                    ? 'border border-accent-border bg-accent text-on-accent hover:bg-accent-hover focus-visible:outline-[var(--on-accent)] focus-visible:outline-offset-0'
                    : 'bg-surface-muted text-subtle',
                  'disabled:cursor-not-allowed',
                )}
              >
                {createComment.isPending ? (
                  <Spinner className="size-4" />
                ) : (
                  <SendHorizontal className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {}
        {engaged && (
          <p className="mt-1 px-1 text-[0.6875rem] text-subtle">
            <kbd className="font-sans font-medium">Enter</kbd> {t('comment.hintSend')} ·{' '}
            <kbd className="font-sans font-medium">Shift</kbd>+
            <kbd className="font-sans font-medium">Enter</kbd> {t('comment.hintNewline')}
          </p>
        )}
      </div>
    </div>
  )
}

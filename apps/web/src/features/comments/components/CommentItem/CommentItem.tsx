import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, CornerDownRight, Pencil, Trash2, X } from 'lucide-react'
import { Avatar, Button, ConfirmDialog, Input } from '@/components/ui'
import { RichText } from '@/components/RichText'
import { absoluteTime, relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useAuth } from '@/providers/auth-context'
import { useDeleteComment, useUpdateComment } from '../../hooks'
import { CommentForm } from '../CommentForm'
import type { Comment } from '@/types/api'
import { useI18n } from '@/i18n'

export interface CommentNode extends Comment {
  replies: CommentNode[]
}


const MAX_INDENT_DEPTH = 2

const COLLAPSE_AFTER = 3

export function CommentItem({ comment }: { comment: CommentNode }) {
  const { t } = useI18n()
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [replying, setReplying] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState(comment.content)

  const updateComment = useUpdateComment()
  const deleteComment = useDeleteComment()
  const isOwner = user?.id === comment.author.id

  const replies = comment.replies
  const hidden = expanded ? 0 : Math.max(0, replies.length - COLLAPSE_AFTER)
  const visible = expanded ? replies : replies.slice(0, COLLAPSE_AFTER)

  return (
    <li>
      <div className="flex gap-2.5">
        <Link to={`/u/${comment.author.username}`} className="shrink-0 rounded-full">
          <Avatar src={comment.author.photo} name={comment.author.name} size="sm" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="rounded-2xl rounded-ss-sm bg-surface-muted px-3.5 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <Link
                to={`/u/${comment.author.username}`}
                className="truncate text-sm font-semibold text-content hover:underline"
              >
                <bdi>{comment.author.name}</bdi>
              </Link>
              <time
                dateTime={comment.createdAt ?? undefined}
                title={absoluteTime(comment.createdAt)}
                className="shrink-0 text-xs text-subtle"
              >
                {relativeTime(comment.createdAt)}
              </time>
            </div>

            {editing ? (
              <div className="mt-2 flex items-center gap-1.5">
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  aria-label={t('comment.edit')}
                  autoFocus
                  className="h-8 bg-surface py-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t('comment.saveEdit')}
                  loading={updateComment.isPending}
                  onClick={() =>
                    updateComment.mutate(
                      { id: comment.id, content: draft.trim() },
                      { onSuccess: () => setEditing(false) },
                    )
                  }
                  disabled={!draft.trim()}
                >
                  <Check className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t('comment.cancelEdit')}
                  onClick={() => {
                    setDraft(comment.content)
                    setEditing(false)
                  }}
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-content">
                <RichText text={comment.content} />
              </p>
            )}
          </div>

          {!editing && (
            <div className="mt-1 flex gap-1 ps-1">
              <button
                type="button"
                onClick={() => setReplying((value) => !value)}
                className="inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-subtle transition-colors hover:text-content"
              >
                <CornerDownRight className="size-3" aria-hidden="true" />
                {t('comment.replyAction')}
              </button>

              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-xs text-subtle transition-colors hover:text-content"
                  >
                    <Pencil className="size-3" aria-hidden="true" />
                    {t('common.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-xs text-subtle transition-colors hover:text-danger"
                  >
                    <Trash2 className="size-3" aria-hidden="true" />
                    {t('common.delete')}
                  </button>
                </>
              )}
            </div>
          )}

          {replying && (
            <div className="mt-2.5">
              <CommentForm
                postId={comment.postId}
                parentId={comment.id}
                replyingTo={comment.author.username}
                autoFocus
                onCancel={() => setReplying(false)}
                onDone={() => setReplying(false)}
              />
            </div>
          )}

          {replies.length > 0 && (
            <ul
              className={cn(
                'mt-3 space-y-3',

                comment.depth < MAX_INDENT_DEPTH && 'border-s border-line ps-3',
              )}
            >
              {visible.map((reply) => (
                <CommentItem key={reply.id} comment={reply} />
              ))}

              {hidden > 0 && (
                <li>
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="cursor-pointer text-xs font-medium text-brand-text hover:underline"
                  >
                    Show {hidden} more {hidden === 1 ? 'reply' : 'replies'}
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          open
          onClose={() => setConfirming(false)}
          onConfirm={() =>
            deleteComment.mutate(comment.id, { onSuccess: () => setConfirming(false) })
          }
          loading={deleteComment.isPending}
          title={t('comment.delete.title')}
          description={
            replies.length > 0
              ? t('comment.deleteWithReplies', { count: replies.length })
              : 'This cannot be undone.'
          }
        />
      )}
    </li>
  )
}

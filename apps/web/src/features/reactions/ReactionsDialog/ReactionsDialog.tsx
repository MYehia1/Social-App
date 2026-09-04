import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Modal, Skeleton } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { ReactionType } from '@/types/api'
import { usePostReactions } from '../hooks'
import { REACTION_META } from '../reactionMeta'


export function ReactionsDialog({
  postId,
  open,
  onClose,
}: {
  postId: string
  open: boolean
  onClose: () => void
}) {
  const [filter, setFilter] = useState<ReactionType | 'all'>('all')
  const { data: reactions = [], isLoading } = usePostReactions(postId, open)


  const used = [...new Set(reactions.map((r) => r.type))]
  const shown = filter === 'all' ? reactions : reactions.filter((r) => r.type === filter)

  return (
    <Modal open={open} onClose={onClose} title="Reactions" className="max-w-md">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_unused, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : reactions.length === 0 ? (
        <p className="py-4 text-sm text-muted">No reactions yet.</p>
      ) : (
        <>
          {used.length > 1 && (
            <div role="tablist" aria-label="Filter by reaction" className="mb-3 flex gap-1">
              <FilterTab
                active={filter === 'all'}
                onClick={() => setFilter('all')}
                label={`All ${reactions.length}`}
              />
              {used.map((type) => (
                <FilterTab
                  key={type}
                  active={filter === type}
                  onClick={() => setFilter(type)}
                  label={`${REACTION_META[type].emoji} ${
                    reactions.filter((r) => r.type === type).length
                  }`}
                  title={REACTION_META[type].label}
                />
              ))}
            </div>
          )}

          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {shown.map(({ user, type }) => (
              <li key={`${user.id}-${type}`}>
                <Link
                  to={`/u/${user.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-hover"
                >
                  <div className="relative shrink-0">
                    <Avatar src={user.photo} name={user.name} size="sm" />
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-1 -end-1 text-sm leading-none"
                    >
                      {REACTION_META[type].emoji}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-content">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-subtle">
                      <bdi>@{user.username}</bdi>
                    </p>
                  </div>
                  <span className="sr-only">reacted with {REACTION_META[type].label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  )
}

function FilterTab({
  active,
  onClick,
  label,
  title,
}: {
  active: boolean
  onClick: () => void
  label: string
  title?: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      title={title}
      className={cn(
        'cursor-pointer rounded-lg px-2.5 py-1 text-sm font-medium transition-colors',
        active
          ? 'bg-brand-soft text-brand-text'
          : 'text-muted hover:bg-surface-hover hover:text-content',
      )}
    >
      {label}
    </button>
  )
}

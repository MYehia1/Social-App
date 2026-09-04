import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Clock, UserPlus, UserX, Users, X } from 'lucide-react'
import { Avatar, Button, Card, EmptyState, Skeleton } from '@/components/ui'
import { cn } from '@/lib/cn'
import { relativeTime } from '@/lib/format'
import {
  useFriends,
  useIncomingRequests,
  useOutgoingRequests,
  useRemoveFriend,
  useRespondToRequest,
  useSendFriendRequest,
  useSuggestions,
} from '@/features/friends/hooks'
import type { Author } from '@/types/api'
import { useI18n } from '@/i18n'

type Tab = 'friends' | 'requests' | 'discover'

function PersonRow({
  person,
  subtitle,
  action,
}: {
  person: Author
  subtitle?: string
  action: React.ReactNode
}) {
  return (
    <li className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
      <Link to={`/u/${person.username}`} className="rounded-full">
        <Avatar src={person.photo} name={person.name} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          to={`/u/${person.username}`}
          className="block truncate text-sm font-semibold text-content hover:underline"
        >
          <bdi>{person.name}</bdi>
        </Link>
        <p className="truncate text-xs text-subtle">
          <bdi>@{person.username}</bdi>
          {subtitle ? ` · ${subtitle}` : ''}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">{action}</div>
    </li>
  )
}

function RowSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 3 }, (_unused, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

function FriendsTab() {
  const { t } = useI18n()
  const { data, isLoading } = useFriends()
  const remove = useRemoveFriend()
  const friends = data?.pages.flatMap((page) => page.items) ?? []

  if (isLoading) return <RowSkeleton />
  if (friends.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={t('friends.empty.title')}
        description={t('friends.empty.description')}
      />
    )
  }

  return (
    <ul>
      {friends.map((friend) => (
        <PersonRow
          key={friend.id}
          person={friend}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => remove.mutate(friend.id)}
              disabled={remove.isPending}
            >
              <UserX className="size-4" aria-hidden="true" />
              {t('friends.remove')}
            </Button>
          }
        />
      ))}
    </ul>
  )
}

function RequestsTab() {
  const { t } = useI18n()
  const incoming = useIncomingRequests()
  const outgoing = useOutgoingRequests()
  const respond = useRespondToRequest()

  const received = incoming.data?.pages.flatMap((page) => page.items) ?? []
  const sent = outgoing.data?.pages.flatMap((page) => page.items) ?? []

  if (incoming.isLoading) return <RowSkeleton />

  if (received.length === 0 && sent.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title={t('friends.requests.empty.title')}
        description={t('friends.requests.empty.description')}
      />
    )
  }

  return (
    <>
      {received.length > 0 && (
        <>
          <h2 className="border-b border-line px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-subtle">
            {t('friends.received')}
          </h2>
          <ul>
            {received.map((request) => (
              <PersonRow
                key={request.id}
                person={request.user}
                subtitle={relativeTime(request.createdAt)}
                action={
                  <>
                    <Button
                      size="sm"
                      onClick={() => respond.mutate({ id: request.id, accept: true })}
                      disabled={respond.isPending}
                    >
                      <Check className="size-4" aria-hidden="true" />
                      {t('friends.accept')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => respond.mutate({ id: request.id, accept: false })}
                      disabled={respond.isPending}
                    >
                      <X className="size-4" aria-hidden="true" />
                      {t('friends.decline')}
                    </Button>
                  </>
                }
              />
            ))}
          </ul>
        </>
      )}

      {sent.length > 0 && (
        <>
          <h2 className="border-b border-t border-line px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-subtle">
            {t('friends.sent')}
          </h2>
          <ul>
            {sent.map((request) => (
              <PersonRow
                key={request.id}
                person={request.user}
                subtitle={relativeTime(request.createdAt)}
                action={
                  <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-subtle">
                    <Clock className="size-4" aria-hidden="true" />
                    {t('friends.pending')}
                  </span>
                }
              />
            ))}
          </ul>
        </>
      )}
    </>
  )
}

function DiscoverTab() {
  const { t } = useI18n()
  const { data: people = [], isLoading } = useSuggestions()
  const send = useSendFriendRequest()
  const [sentTo, setSentTo] = useState<Set<string>>(new Set())

  if (isLoading) return <RowSkeleton />
  if (people.length === 0) {
    return (
      <EmptyState
        icon={UserPlus}
        title={t('friends.discover.empty.title')}
        description={t('friends.discover.empty.description')}
      />
    )
  }

  return (
    <ul>
      {people.map((person) => {
        const alreadySent = sentTo.has(person.id)
        return (
          <PersonRow
            key={person.id}
            person={person}
            action={
              <Button
                size="sm"
                variant={alreadySent ? 'secondary' : 'primary'}
                disabled={alreadySent || send.isPending}
                onClick={() =>
                  send.mutate(person.id, {


                    onSuccess: () => setSentTo((prev) => new Set(prev).add(person.id)),
                  })
                }
              >
                {alreadySent ? (
                  <>
                    <Clock className="size-4" aria-hidden="true" />
                    {t('friends.sent')}
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" aria-hidden="true" />
                    Add friend
                  </>
                )}
              </Button>
            }
          />
        )
      })}
    </ul>
  )
}

export function FriendsPage() {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('friends')
  const incoming = useIncomingRequests()
  const pendingCount = incoming.data?.pages[0]?.items.length ?? 0

  const tabs: Array<{ id: Tab; label: string; badge?: number }> = [
    { id: 'friends', label: t('friends.tab.friends') },
    { id: 'requests', label: t('friends.tab.requests'), badge: pendingCount },
    { id: 'discover', label: t('friends.tab.discover') },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight text-content">{t('friends.title')}</h1>

      <Card className="overflow-hidden">
        <div role="tablist" aria-label={t('friends.title')} className="flex border-b border-line">
          {tabs.map(({ id, label, badge }) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                'flex flex-1 cursor-pointer items-center justify-center gap-1.5 px-4 py-3',
                'text-sm font-medium transition-colors',


                'border-b-2',



                'focus-visible:-outline-offset-2',
                tab === id
                  ? 'border-brand text-brand-text'
                  : 'border-transparent text-muted hover:bg-surface-hover hover:text-content',
              )}
            >
              {label}
              {badge ? (
                <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-xs font-semibold text-on-accent">
                  {badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div role="tabpanel">
          {tab === 'friends' && <FriendsTab />}
          {tab === 'requests' && <RequestsTab />}
          {tab === 'discover' && <DiscoverTab />}
        </div>
      </Card>
    </div>
  )
}

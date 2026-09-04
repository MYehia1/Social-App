import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  AtSign,
  Bell,
  CheckCheck,
  CornerDownRight,
  Heart,
  MessageCircle,
  UserPlus,
  Users,
} from 'lucide-react'
import { Avatar, Button, Card, EmptyState, Skeleton, Spinner } from '@/components/ui'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useMarkAllRead, useMarkRead, useNotifications } from '@/features/notifications/hooks'
import { PushToggle } from '@/features/notifications/components/PushToggle'
import type { Notification, NotificationType } from '@/types/api'
import { useI18n } from '@/i18n'


// The verb is a translation key rather than a string: the notification feed
// is the one place where every sentence is assembled at render time.
const META: Record<NotificationType, { icon: typeof Bell; tint: string }> = {
  reaction: { icon: Heart, tint: 'text-danger' },
  comment: { icon: MessageCircle, tint: 'text-brand-text' },
  reply: { icon: CornerDownRight, tint: 'text-brand-text' },
  mention_post: { icon: AtSign, tint: 'text-brand-text' },
  mention_comment: { icon: AtSign, tint: 'text-brand-text' },
  friend_request: { icon: UserPlus, tint: 'text-brand-text' },
  friend_accepted: { icon: Users, tint: 'text-success' },
}

function NotificationRow({ notification }: { notification: Notification }) {
  const { t } = useI18n()
  const markRead = useMarkRead()
  const meta = META[notification.type]
  const Icon = meta.icon


  const href = notification.postId
    ? `/post/${notification.postId}`
    : notification.type.startsWith('friend')
      ? '/friends'
      : `/u/${notification.actor.username}`

  return (
    <li>
      <Link
        to={href}
        onClick={() => {
          if (!notification.read) markRead.mutate(notification.id)
        }}
        className={cn(
          'flex gap-3 border-b border-line px-4 py-3.5 transition-colors last:border-b-0',
          'hover:bg-surface-hover',
          !notification.read && 'bg-accent-soft/50',
        )}
      >
        <div className="relative shrink-0">
          <Avatar src={notification.actor.photo} name={notification.actor.name} />
          <span
            className={cn(
              'absolute -bottom-0.5 -end-0.5 grid size-5 place-items-center rounded-full',
              'border-2 border-surface bg-surface',
              meta.tint,
            )}
          >
            <Icon className="size-3" aria-hidden="true" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-content">
            <span className="font-semibold">
              <bdi>{notification.actor.name}</bdi>
            </span>
            <span className="text-muted">
              {' '}
              {t(`notifications.verb.${notification.type}`)}
            </span>
          </p>
          {notification.excerpt && (
            <p className="mt-0.5 truncate text-sm text-subtle">{notification.excerpt}</p>
          )}
          <p className="mt-1 text-xs text-subtle">{relativeTime(notification.createdAt)}</p>
        </div>

        {!notification.read && (
          <span
            className="mt-2 size-2 shrink-0 rounded-full bg-accent"
            aria-label={t('notifications.unread')}
          />
        )}
      </Link>
    </li>
  )
}

export function NotificationsPage() {
  const { t } = useI18n()
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotifications()
  const markAllRead = useMarkAllRead()
  const sentinelRef = useRef<HTMLDivElement>(null)

  const items = data?.pages.flatMap((page) => page.items) ?? []
  const unread = items.filter((n) => !n.read).length

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void fetchNextPage()
      },
      { rootMargin: '300px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-content">
          {t('notifications.title')}
        </h1>
        <div className="flex items-center gap-2">
          <PushToggle />
          {unread > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => markAllRead.mutate()}
              loading={markAllRead.isPending}
            >
              <CheckCheck className="size-4" aria-hidden="true" />
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-4 p-4">
            {Array.from({ length: 4 }, (_unused, index) => (
              <div key={index} className="flex gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="p-4 text-sm text-danger">
            {error instanceof Error ? error.message : t('notifications.failed')}
          </p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={t('notifications.empty.title')}
            description={t('notifications.empty.description')}
          />
        ) : (
          <ul>
            {items.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </ul>
        )}
      </Card>

      <div ref={sentinelRef} className="flex justify-center py-2">
        {isFetchingNextPage && <Spinner className="text-subtle" />}
      </div>
    </div>
  )
}

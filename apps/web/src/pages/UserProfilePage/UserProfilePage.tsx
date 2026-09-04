import { useQuery } from '@tanstack/react-query'
import { Navigate, useParams } from 'react-router-dom'
import { Check, Clock, FileText, UserPlus, UserX } from 'lucide-react'
import { Button, Card, EmptyState, Skeleton } from '@/components/ui'
import { usersApi } from '@/lib/api/users'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/providers/auth-context'
import { useUserPosts } from '@/features/posts/hooks'
import { InfinitePostList } from '@/features/feed/components/InfinitePostList'
import { ProfileHeader } from '@/features/profile/components/ProfileHeader'
import {
  useRemoveFriend,
  useRespondToRequest,
  useSendFriendRequest,
} from '@/features/friends/hooks'
import type { FriendState } from '@/types/api'
import { useI18n } from '@/i18n'


function FriendAction({ userId, state }: { userId: string; state: FriendState }) {
  const send = useSendFriendRequest()
  const remove = useRemoveFriend()
  const respond = useRespondToRequest()

  if (state === 'self') return null

  if (state === 'friends') {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => remove.mutate(userId)}
        loading={remove.isPending}
      >
        <UserX className="size-4" aria-hidden="true" />
        Remove friend
      </Button>
    )
  }

  if (state === 'request_sent') {
    return (
      <Button variant="secondary" size="sm" disabled>
        <Clock className="size-4" aria-hidden="true" />
        Request sent
      </Button>
    )
  }

  if (state === 'request_received') {
    return (
      <Button
        size="sm"


        onClick={() => send.mutate(userId)}
        loading={send.isPending || respond.isPending}
      >
        <Check className="size-4" aria-hidden="true" />
        Accept request
      </Button>
    )
  }

  return (
    <Button size="sm" onClick={() => send.mutate(userId)} loading={send.isPending}>
      <UserPlus className="size-4" aria-hidden="true" />
      Add friend
    </Button>
  )
}

export function UserProfilePage() {
  const { t } = useI18n()
  const { username = '' } = useParams()
  const { user: me } = useAuth()

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.profile(username),
    queryFn: () => usersApi.byUsername(username),
    enabled: Boolean(username),
  })

  const profile = data?.user
  const posts = useUserPosts(profile?.id)
  const items = posts.data?.pages.flatMap((page) => page.items) ?? []


  if (profile && me && profile.id === me.id) return <Navigate to="/profile" replace />

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="h-36 bg-surface-muted sm:h-48" />
        <div className="space-y-3 p-5">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-56" />
        </div>
      </Card>
    )
  }

  if (error || !profile) {
    return (
      <EmptyState
        icon={FileText}
        title={t('profile.notFound.title')}
        description={`No account exists with the handle @${username}.`}
      />
    )
  }

  return (
    <div className="space-y-4">
      <ProfileHeader
        user={profile}
        postCount={posts.data?.pages[0]?.items.length ?? 0}
        action={
          <FriendAction userId={profile.id} state={data.friendState} />
        }
      />

      <h2 className="px-1 pt-2 text-sm font-semibold text-content">
        Posts by {profile.name}
      </h2>

      <InfinitePostList
        posts={items}
        isLoading={posts.isLoading}
        isFetchingNextPage={posts.isFetchingNextPage}
        hasNextPage={posts.hasNextPage}
        fetchNextPage={posts.fetchNextPage}
        error={posts.error}
        emptyIcon={FileText}
        emptyTitle={t('feed.empty.title')}
        emptyDescription={`${profile.name} has not posted anything.`}
      />
    </div>
  )
}

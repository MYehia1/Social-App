import { FileText } from 'lucide-react'
import { Card, Skeleton } from '@/components/ui'
import { useAuth } from '@/providers/auth-context'
import { useUserPosts } from '@/features/posts/hooks'
import { InfinitePostList } from '@/features/feed/components/InfinitePostList'
import { ProfileHeader } from '@/features/profile/components/ProfileHeader'
import { useI18n } from '@/i18n'

export function ProfilePage() {
  const { t } = useI18n()
  const { user, isLoading: isLoadingUser } = useAuth()
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error } =
    useUserPosts(user?.id)

  const posts = data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div className="space-y-4">
      {isLoadingUser || !user ? (
        <Card className="overflow-hidden">
          <div className="h-36 bg-surface-muted sm:h-48" />
          <div className="space-y-3 p-5">
            <Skeleton className="size-24 rounded-full" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-56" />
          </div>
        </Card>
      ) : (
        <ProfileHeader user={user} postCount={data?.pages[0]?.items.length ?? 0} editable />
      )}

      <h2 className="px-1 pt-2 text-sm font-semibold text-content">{t('feed.yourPosts')}</h2>

      <InfinitePostList
        posts={posts}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        error={error}
        emptyIcon={FileText}
        emptyTitle={t('profile.empty.title')}
        emptyDescription={t('profile.empty.description')}
      />
    </div>
  )
}

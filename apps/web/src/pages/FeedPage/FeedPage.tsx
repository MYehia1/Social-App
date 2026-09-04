import { Newspaper } from 'lucide-react'
import { useFeed } from '@/features/feed/hooks'
import { InfinitePostList } from '@/features/feed/components/InfinitePostList'
import { Composer } from '@/features/posts/components/Composer'
import { useI18n } from '@/i18n'

export function FeedPage() {
  const { t } = useI18n()
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error } =
    useFeed()

  const posts = data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div className="space-y-4">
      <h1 className="sr-only">{t('feed.title')}</h1>
      <Composer />
      <InfinitePostList
        posts={posts}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        error={error}
        emptyIcon={Newspaper}
        emptyTitle={t('feed.empty.title')}
        emptyDescription={t('feed.empty.description')}
      />
    </div>
  )
}

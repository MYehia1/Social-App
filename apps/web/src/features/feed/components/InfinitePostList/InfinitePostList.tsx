import { useEffect, useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button, EmptyState, Spinner } from '@/components/ui'
import { PostCard } from '@/features/posts/components/PostCard'
import { PostSkeletonList } from '../PostSkeleton'
import type { Post } from '@/types/api'

interface InfinitePostListProps {
  posts: Post[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  error: unknown
  emptyIcon: LucideIcon
  emptyTitle: string
  emptyDescription: string
}

export function InfinitePostList({
  posts,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  error,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: InfinitePostListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage()
      },
      { rootMargin: '400px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) return <PostSkeletonList />

  if (error) {
    return (
      <div className="rounded-card border border-danger/30 bg-danger-soft p-4 text-sm">
        <p className="font-medium text-danger">Couldn&apos;t load posts</p>
        <p className="mt-1 text-muted">
          {error instanceof Error ? error.message : 'Please try again.'}
        </p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => fetchNextPage()}>
          Retry
        </Button>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && <Spinner className="text-subtle" />}
        {!hasNextPage && posts.length > 0 && (
          <p className="text-xs text-subtle">You&apos;re all caught up</p>
        )}
      </div>
    </div>
  )
}

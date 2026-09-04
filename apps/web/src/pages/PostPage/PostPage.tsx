import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileQuestion } from 'lucide-react'
import { Card, EmptyState } from '@/components/ui'
import { usePost } from '@/features/posts/hooks'
import { PostCard } from '@/features/posts/components/PostCard'
import { PostSkeleton } from '@/features/feed/components/PostSkeleton'
import { CommentForm } from '@/features/comments/components/CommentForm'
import { CommentList } from '@/features/comments/components/CommentList'
import { useI18n } from '@/i18n'

export function PostPage() {
  const { t } = useI18n()
  const { id = '' } = useParams()
  const { data, isLoading, error } = usePost(id)

  return (
    <div className="space-y-4">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 rounded-lg py-1 text-sm font-medium text-muted transition-colors hover:text-content"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('post.backToFeed')}
      </Link>

      {isLoading && <PostSkeleton />}

      {error && (
        <EmptyState
          icon={FileQuestion}
          title={t('post.notFound.title')}
          description={
            error instanceof Error ? error.message : t('post.notFound.description')
          }
        />
      )}

      {data && (
        <>
          <PostCard post={data.post} detailed />

          <Card className="space-y-4 p-4">
            <h2 className="text-sm font-semibold text-content">
              {t('comment.headingCount', { count: data.comments.length })}
            </h2>
            <CommentForm postId={data.post.id} />
            <CommentList comments={data.comments} />
          </Card>
        </>
      )}
    </div>
  )
}

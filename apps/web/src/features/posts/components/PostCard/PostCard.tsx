import { Link, useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { Avatar, Card } from '@/components/ui'
import { cn } from '@/lib/cn'
import { RichText } from '@/components/RichText'
import { absoluteTime, relativeTime } from '@/lib/format'
import { useAuth } from '@/providers/auth-context'
import { ReactionBar } from '@/features/reactions/ReactionBar'
import { PostActions } from '../PostActions'
import type { Post } from '@/types/api'

interface PostCardProps {
  post: Post

  detailed?: boolean
}

export function PostCard({ post, detailed = false }: PostCardProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isOwner = user?.id === post.author.id


  function handleCardClick(event: React.MouseEvent<HTMLDivElement>) {
    if (detailed) return
    if ((event.target as HTMLElement).closest('a, button, video, input, textarea')) return
    if (window.getSelection()?.toString()) return
    void navigate(`/post/${post.id}`)
  }

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        'relative overflow-hidden transition-colors hover:border-line-strong',
        !detailed && 'cursor-pointer',
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <Link to={`/u/${post.author.username}`} className="rounded-full">
          <Avatar src={post.author.photo} name={post.author.name} />
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            to={`/u/${post.author.username}`}
            className="block w-fit truncate text-sm font-semibold text-content hover:underline"
          >
            <bdi>{post.author.name}</bdi>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-subtle">
            <span className="truncate">@{post.author.username}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.createdAt ?? undefined} title={absoluteTime(post.createdAt)}>
              {relativeTime(post.createdAt)}
            </time>
          </div>
        </div>

        {isOwner && <PostActions post={post} />}
      </div>

      {post.body && (
        <div className="px-4 pb-3">
          <p
            className={cn(
              'whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-content',
              !detailed && 'line-clamp-4',
            )}
          >
            <RichText text={post.body} />
          </p>
        </div>
      )}

      {post.image && (
        <img
          src={post.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="max-h-[32rem] w-full border-y border-line object-cover"
        />
      )}

      {post.video && (
        <video
          src={post.video}
          controls
          playsInline
          preload="metadata"
          className="max-h-[32rem] w-full border-y border-line bg-black"
        />
      )}

      <div className="flex items-center justify-between gap-2 px-2 py-2">
        <ReactionBar post={post} />

        <Link
          to={`/post/${post.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-content"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          <span className="tabular-nums">{post.commentCount}</span>
          <span className="sr-only">
            {post.commentCount === 1 ? 'comment' : 'comments'}
          </span>
        </Link>
      </div>
    </Card>
  )
}

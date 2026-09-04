import { useMemo } from 'react'
import { CommentItem, type CommentNode } from '../CommentItem'
import type { Comment } from '@/types/api'

function buildTree(comments: Comment[]): CommentNode[] {
  const byId = new Map<string, CommentNode>()
  for (const comment of comments) {
    byId.set(comment.id, { ...comment, replies: [] })
  }

  const roots: CommentNode[] = []
  for (const comment of comments) {
    const node = byId.get(comment.id)
    if (!node) continue

    const parent = comment.parentId ? byId.get(comment.parentId) : undefined
    if (parent) parent.replies.push(node)
    else roots.push(node)
  }

  return roots
}

export function CommentList({ comments }: { comments: Comment[] }) {
  const tree = useMemo(() => buildTree(comments), [comments])

  if (comments.length === 0) {
    return (
      <p className="py-2 text-sm text-subtle">
        No comments yet. Start the conversation.
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {tree.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </ul>
  )
}

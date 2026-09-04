import type { CommentDocument, UserDocument } from '../../DB/models'
import { toPublicAuthor, type PublicAuthor } from '../posts/post.mapper'

export interface PublicComment {
  id: string
  content: string
  postId: string
  /** null for a top-level comment. */
  parentId: string | null
  depth: number
  replyCount: number
  createdAt: string | null
  author: PublicAuthor
}

export function toPublicComment(comment: CommentDocument): PublicComment {
  return {
    id: comment._id.toString(),
    content: comment.content,
    postId: comment.post.toString(),
    parentId: comment.parent?.toString() ?? null,
    depth: comment.depth ?? 0,
    replyCount: comment.replyCount ?? 0,
    createdAt: comment.createdAt?.toISOString() ?? null,
    author: toPublicAuthor(comment.author as unknown as UserDocument),
  }
}

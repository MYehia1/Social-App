import type { Types } from 'mongoose'
import type { NotificationDocument, UserDocument } from '../../DB/models'
import { toPublicAuthor, type PublicAuthor } from '../posts/post.mapper'

export interface PublicNotification {
  id: string
  type: string
  read: boolean
  createdAt: string | null
  actor: PublicAuthor
  postId: string | null
  /** A short excerpt of the post or comment, for context in the list. */
  excerpt: string | null
}

function excerpt(value: string | undefined, max = 80): string | null {
  if (!value) return null
  const text = value.trim()
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export function toPublicNotification(n: NotificationDocument): PublicNotification {
  // Populated by the service; narrowed here so the id stringifies correctly.
  const post = n.post as unknown as { _id?: Types.ObjectId; body?: string } | undefined
  const comment = n.comment as unknown as { content?: string } | undefined

  return {
    id: n._id.toString(),
    type: n.type,
    read: Boolean(n.readAt),
    createdAt: n.createdAt?.toISOString() ?? null,
    actor: toPublicAuthor(n.actor as unknown as UserDocument),
    postId: post?._id ? post._id.toString() : null,
    excerpt: excerpt(comment?.content ?? post?.body),
  }
}

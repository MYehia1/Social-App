import type { PostDocument, UserDocument } from '../../DB/models'

export interface PublicAuthor {
  id: string
  name: string
  username: string
  photo: string | null
}

export interface PublicPost {
  id: string
  body: string
  image: string | null
  video: string | null
  commentCount: number
  /** Tally per reaction type, e.g. { like: 3, love: 1 }. */
  reactions: Record<string, number>
  reactionTotal: number
  /** The viewer's own reaction, or null. */
  myReaction: string | null
  createdAt: string | null
  author: PublicAuthor
}

export function toPublicAuthor(user: UserDocument | null | undefined): PublicAuthor {
  // A post whose author was removed still has to render, so fall back rather
  // than throwing deep inside a list response.
  if (!user) return { id: '', name: 'Deleted user', username: 'unknown', photo: null }
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    photo: user.photo ?? null,
  }
}

function toCounts(counts: Map<string, number> | undefined): Record<string, number> {
  const out: Record<string, number> = {}
  if (!counts) return out
  for (const [key, value] of counts.entries()) {
    // Drop zeroed entries so the client never renders an empty pill.
    if (value > 0) out[key] = value
  }
  return out
}

export function toPublicPost(
  post: PostDocument,
  myReaction: string | null = null,
): PublicPost {
  const reactions = toCounts(post.reactionCounts)

  return {
    id: post._id.toString(),
    body: post.body,
    image: post.image ?? null,
    video: post.video ?? null,
    commentCount: post.commentCount,
    reactions,
    reactionTotal: Object.values(reactions).reduce((sum, n) => sum + n, 0),
    myReaction,
    createdAt: post.createdAt?.toISOString() ?? null,
    author: toPublicAuthor(post.author as unknown as UserDocument),
  }
}

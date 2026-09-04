export const REACTION_TYPES = ['like', 'love', 'haha', 'wow', 'sad', 'angry'] as const
export type ReactionType = (typeof REACTION_TYPES)[number]

export interface Author {
  id: string
  name: string
  username: string
  photo: string | null
}

export interface User extends Author {
  email: string

  coverPhotos: string[]

  coverPhoto: string | null
  bio: string | null
  friendCount: number
  gender: string
  role: string
  dateOfBirth: string | null
  createdAt: string | null
}

export interface Post {
  id: string
  body: string
  image: string | null
  video: string | null
  commentCount: number

  reactions: Partial<Record<ReactionType, number>>
  reactionTotal: number

  myReaction: ReactionType | null
  createdAt: string | null
  author: Author
}

export interface Comment {
  id: string
  content: string
  postId: string

  parentId: string | null
  depth: number
  replyCount: number
  createdAt: string | null
  author: Author
}


export interface MentionSuggestion extends Author {
  isFriend: boolean
}

export type NotificationType =
  | 'mention_post'
  | 'mention_comment'
  | 'comment'
  | 'reply'
  | 'reaction'
  | 'friend_request'
  | 'friend_accepted'

export interface Notification {
  id: string
  type: NotificationType
  read: boolean
  createdAt: string | null
  actor: Author
  postId: string | null
  excerpt: string | null
}

export interface FriendRequest {
  id: string
  user: Author
  createdAt: string | null
}

export type FriendState =
  | 'none'
  | 'friends'
  | 'request_sent'
  | 'request_received'
  | 'self'

export interface ReactionSummary {
  reactions: Partial<Record<ReactionType, number>>
  reactionTotal: number
  myReaction: ReactionType | null
}


export interface Page<T> {
  items: T[]
  nextPage: number | null
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
}


export interface Envelope<T> {
  status: number
  message: string
  data: T
  meta?: PaginationMeta
}


export interface ErrorEnvelope {
  status: number
  error: {
    message: string
    code: string
    details?: Array<{ field: string; message: string }> | Record<string, unknown>
  }
}





export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  rePassword: string
  dateOfBirth: string
  gender: 'male' | 'female'
}

export interface ChangePasswordPayload {
  password: string
  newPassword: string
}

export interface ProfilePayload {
  name?: string
  username?: string
  bio?: string
}

export interface PostPayload {
  body: string
  image?: File | null
  video?: File | null
}

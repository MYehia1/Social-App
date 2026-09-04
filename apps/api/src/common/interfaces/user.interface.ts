import type { Types } from 'mongoose'
import type {
  FriendshipStatusEnum,
  GenderEnum,
  NotificationEnum,
  ProviderEnum,
  ReactionEnum,
  RoleEnum,
} from '../enums'

export interface CoverPhoto {
  url: string
  publicId: string
}

export interface IUser {
  name: string
  /** Unique handle used for @mentions. Generated at signup, editable after. */
  username: string
  email: string
  /** Absent on accounts created through Google. */
  password?: string | undefined

  photo?: string | undefined
  photoPublicId?: string | undefined
  /**
   * Cover photos, newest first.
   *
   * The legacy single `coverPhoto` is kept so existing documents still read
   * correctly; nothing writes it any more, and the mapper folds it in as the
   * oldest entry when an account predates the array.
   */
  covers?: CoverPhoto[] | undefined
  coverPhoto?: string | undefined
  coverPhotoPublicId?: string | undefined

  bio?: string | undefined

  gender: GenderEnum
  role: RoleEnum
  provider: ProviderEnum

  /** Denormalized so a profile does not need to count the join table. */
  friendCount: number

  dateOfBirth?: Date | undefined
  confirmedAt?: Date | undefined
  otpHash?: string | undefined
  otpExpiresAt?: Date | undefined
  otpAttempts?: number | undefined
  credentialsChangedAt?: Date | undefined

  createdAt?: Date
  updatedAt?: Date
}

export interface IPost {
  body: string
  image?: string | undefined
  imagePublicId?: string | undefined
  video?: string | undefined
  videoPublicId?: string | undefined

  author: Types.ObjectId
  /** Users @mentioned in the body, resolved to ids at write time. */
  mentions: Types.ObjectId[]

  commentCount: number
  /** Per-reaction tallies, so the feed never aggregates on read. */
  reactionCounts: Map<string, number>

  deletedAt?: Date | undefined
  createdAt?: Date
  updatedAt?: Date
}

export interface IComment {
  content: string
  post: Types.ObjectId
  author: Types.ObjectId
  mentions: Types.ObjectId[]
  /** The comment this replies to. Absent on a top-level comment. */
  parent?: Types.ObjectId | undefined
  /** 0 for a top-level comment, 1 for a reply, and so on. */
  depth: number
  /** Direct replies only, so a thread can show "N replies" without counting. */
  replyCount: number
  deletedAt?: Date | undefined
  createdAt?: Date
  updatedAt?: Date
}

export interface IReaction {
  post: Types.ObjectId
  user: Types.ObjectId
  type: ReactionEnum
  createdAt?: Date
  updatedAt?: Date
}

export interface INotification {
  recipient: Types.ObjectId
  actor: Types.ObjectId
  type: NotificationEnum
  post?: Types.ObjectId | undefined
  comment?: Types.ObjectId | undefined
  readAt?: Date | undefined
  createdAt?: Date
  updatedAt?: Date
}

export interface IFriendship {
  requester: Types.ObjectId
  recipient: Types.ObjectId
  status: FriendshipStatusEnum
  respondedAt?: Date | undefined
  createdAt?: Date
  updatedAt?: Date
}

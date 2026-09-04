import { Schema, model, type HydratedDocument } from 'mongoose'
import { FriendshipStatusEnum } from '../../common/enums'
import type { IFriendship } from '../../common/interfaces'

/**
 * One row per relationship, storing direction so a pending request knows who
 * asked. Accepted friendships are symmetric and are queried with an $or on
 * both columns.
 */
const friendshipSchema = new Schema<IFriendship>(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(FriendshipStatusEnum),
      default: FriendshipStatusEnum.PENDING,
    },
    respondedAt: { type: Date },
  },
  { timestamps: true },
)

// Prevents duplicate requests in the same direction. The service also checks
// the reverse direction before creating one.
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true })
friendshipSchema.index({ recipient: 1, status: 1, createdAt: -1 })
friendshipSchema.index({ requester: 1, status: 1, createdAt: -1 })

export type FriendshipDocument = HydratedDocument<IFriendship>

export const FriendshipModel = model<IFriendship>('Friendship', friendshipSchema)

import { Schema, model, type HydratedDocument } from 'mongoose'
import { ReactionEnum } from '../../common/enums'
import type { IReaction } from '../../common/interfaces'

const reactionSchema = new Schema<IReaction>(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(ReactionEnum), required: true },
  },
  { timestamps: true },
)

// One reaction per user per post — switching reaction updates this row rather
// than inserting a second one. The unique index enforces it at the database
// level, so a double-click race cannot create duplicates.
reactionSchema.index({ post: 1, user: 1 }, { unique: true })

export type ReactionDocument = HydratedDocument<IReaction>

export const ReactionModel = model<IReaction>('Reaction', reactionSchema)

import { Schema, model, type HydratedDocument } from 'mongoose'
import type { IComment } from '../../common/interfaces'

const commentSchema = new Schema<IComment>(
  {
    content: { type: String, required: true, trim: true, maxlength: 300 },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    parent: { type: Schema.Types.ObjectId, ref: 'Comment' },
    // Stored rather than derived, so rendering never has to walk the chain.
    depth: { type: Number, default: 0, min: 0 },
    replyCount: { type: Number, default: 0, min: 0 },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v
        delete ret._id
        return ret
      },
    },
  },
)

// Fetching a post's comments in chronological order.
commentSchema.index({ post: 1, deletedAt: 1, createdAt: 1 })
// Counting or listing the direct replies to one comment.
commentSchema.index({ parent: 1, createdAt: 1 })

commentSchema.virtual('id').get(function (this: HydratedDocument<IComment>) {
  return this._id.toString()
})

export type CommentDocument = HydratedDocument<IComment>

export const CommentModel = model<IComment>('Comment', commentSchema)

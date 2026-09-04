import { Schema, model, type HydratedDocument } from 'mongoose'
import type { IPost } from '../../common/interfaces'

const postSchema = new Schema<IPost>(
  {
    body: { type: String, default: '', trim: true, maxlength: 500 },
    image: { type: String },
    imagePublicId: { type: String },
    video: { type: String },
    videoPublicId: { type: String },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    // Denormalized so the feed does not need a per-post count query.
    commentCount: { type: Number, default: 0, min: 0 },
    // A Map keeps new reaction types from needing a schema migration.
    reactionCounts: { type: Map, of: Number, default: () => new Map() },
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

// The feed sorts newest-first over non-deleted posts.
postSchema.index({ deletedAt: 1, createdAt: -1 })
// A profile's posts, newest-first.
postSchema.index({ author: 1, createdAt: -1 })
// "Posts I was mentioned in".
postSchema.index({ mentions: 1, createdAt: -1 })

postSchema.virtual('id').get(function (this: HydratedDocument<IPost>) {
  return this._id.toString()
})

export type PostDocument = HydratedDocument<IPost>

export const PostModel = model<IPost>('Post', postSchema)

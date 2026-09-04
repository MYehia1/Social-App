import { Schema, model, type HydratedDocument } from 'mongoose'
import { NotificationEnum } from '../../common/enums'
import type { INotification } from '../../common/interfaces'

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NotificationEnum), required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post' },
    comment: { type: Schema.Types.ObjectId, ref: 'Comment' },
    readAt: { type: Date },
  },
  { timestamps: true },
)

// The notification list: mine, newest first.
notificationSchema.index({ recipient: 1, createdAt: -1 })
// The unread badge count.
notificationSchema.index({ recipient: 1, readAt: 1 })

export type NotificationDocument = HydratedDocument<INotification>

export const NotificationModel = model<INotification>('Notification', notificationSchema)

import { NotificationModel } from '../models'
import type { INotification } from '../../common/interfaces'
import { DatabaseRepository } from './base.repository'

export class NotificationRepository extends DatabaseRepository<INotification> {
  constructor() {
    super(NotificationModel)
  }

  countUnread(recipientId: string) {
    return this.model.countDocuments({ recipient: recipientId, readAt: { $exists: false } })
  }

  markAllRead(recipientId: string) {
    return this.model.updateMany(
      { recipient: recipientId, readAt: { $exists: false } },
      { readAt: new Date() },
    )
  }
}

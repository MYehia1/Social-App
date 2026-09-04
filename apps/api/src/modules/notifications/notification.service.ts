import { NotificationEnum } from '../../common/enums'
import { NotificationRepository } from '../../DB/repository'
import type { NotificationDocument } from '../../DB/models'
import type { Types } from 'mongoose'

interface CreateArgs {
  recipient: string | Types.ObjectId
  actor: string
  type: NotificationEnum
  post?: string | Types.ObjectId
  comment?: string | Types.ObjectId
}

class NotificationService {
  private readonly repository = new NotificationRepository()

  /**
   * Creating a notification must never break the action that triggered it —
   * a failed insert should not fail the user's post. Errors are swallowed
   * deliberately and logged.
   */
  async create({ recipient, actor, type, post, comment }: CreateArgs): Promise<void> {
    // Never notify someone about their own action.
    if (recipient.toString() === actor) return

    try {
      await this.repository.create({
        recipient,
        actor,
        type,
        ...(post ? { post } : {}),
        ...(comment ? { comment } : {}),
      })
    } catch (error) {
      console.error('Failed to create notification:', error)
    }
  }

  /** Fan-out for the @mentions in a single post or comment. */
  async createMentions(
    recipients: Types.ObjectId[],
    actor: string,
    type: NotificationEnum,
    refs: { post?: string; comment?: string },
  ): Promise<void> {
    await Promise.all(
      recipients.map((recipient) =>
        this.create({ recipient, actor, type, ...refs }),
      ),
    )
  }

  list(recipientId: string, page: number, limit: number) {
    return this.repository.paginate({
      filter: { recipient: recipientId },
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        { path: 'actor', select: 'name username photo' },
        { path: 'post', select: 'body' },
        { path: 'comment', select: 'content' },
      ],
    })
  }

  unreadCount(recipientId: string) {
    return this.repository.countUnread(recipientId)
  }

  markAllRead(recipientId: string) {
    return this.repository.markAllRead(recipientId)
  }

  async markRead(id: string, recipientId: string): Promise<NotificationDocument | null> {
    // Scoping the update by recipient means one user cannot mark another's
    // notifications as read.
    return this.repository.findOneAndUpdate(
      { _id: id, recipient: recipientId },
      { readAt: new Date() },
    )
  }
}

export const notificationService = new NotificationService()

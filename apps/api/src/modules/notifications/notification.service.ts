import { NotificationEnum } from '../../common/enums'
import { NotificationRepository, UserRepository } from '../../DB/repository'
import type { NotificationDocument } from '../../DB/models'
import { sendPush } from '../../common/push'
import type { Types } from 'mongoose'

interface CreateArgs {
  recipient: string | Types.ObjectId
  actor: string
  type: NotificationEnum
  post?: string | Types.ObjectId | undefined
  comment?: string | Types.ObjectId | undefined
  /** Text shown as the push body — the post or comment that triggered it. */
  excerpt?: string | undefined
}

/** Where tapping the push notification should land in the web app. */
function destination(type: NotificationEnum, post?: string | Types.ObjectId): string {
  if (post) return `/post/${post.toString()}`
  if (type.startsWith('friend')) return '/friends'
  return '/notifications'
}

class NotificationService {
  private readonly repository = new NotificationRepository()
  private readonly users = new UserRepository()

  /**
   * Creating a notification must never break the action that triggered it —
   * a failed insert should not fail the user's post. Errors are swallowed
   * deliberately and logged.
   */
  async create({ recipient, actor, type, post, comment, excerpt }: CreateArgs): Promise<void> {
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
      return
    }

    // The in-app feed is the source of truth; the push is a best-effort
    // extra, so it runs after the insert has already succeeded.
    void this.push({ recipient, actor, type, post, excerpt })
  }

  /**
   * Delivers the notification to the recipient's browsers, and prunes any
   * token Firebase reports as dead so the list cannot grow stale for ever.
   */
  private async push({
    recipient,
    actor,
    type,
    post,
    excerpt,
  }: Omit<CreateArgs, 'comment'>): Promise<void> {
    try {
      const recipientId = recipient.toString()
      const tokens = await this.users.findPushTokens(recipientId)
      if (tokens.length === 0) return

      const actorUser = await this.users.findById(actor)
      if (!actorUser) return

      const { staleTokens } = await sendPush(tokens, {
        actorName: actorUser.name,
        type,
        excerpt,
        path: destination(type, post),
      })

      if (staleTokens.length > 0) {
        await this.users.removePushTokens(recipientId, staleTokens)
      }
    } catch (error) {
      console.error('Failed to push notification:', error)
    }
  }

  /** Registers the browser that sent this token for push delivery. */
  async subscribe(userId: string, token: string): Promise<void> {
    await this.users.addPushToken(userId, token)
  }

  async unsubscribe(userId: string, token: string): Promise<void> {
    await this.users.removePushTokens(userId, [token])
  }

  /** Fan-out for the @mentions in a single post or comment. */
  async createMentions(
    recipients: Types.ObjectId[],
    actor: string,
    type: NotificationEnum,
    refs: { post?: string; comment?: string; excerpt?: string },
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

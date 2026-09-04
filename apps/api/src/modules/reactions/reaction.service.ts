import { NotFoundException } from '../../common/exceptions'
import { NotificationEnum, type ReactionEnum } from '../../common/enums'
import { PostRepository, ReactionRepository } from '../../DB/repository'
import { notificationService } from '../notifications/notification.service'

export interface ReactionResult {
  reactions: Record<string, number>
  reactionTotal: number
  myReaction: string | null
}

class ReactionService {
  private readonly reactionRepository = new ReactionRepository()
  private readonly postRepository = new PostRepository()

  /** Reads the authoritative tallies back off the post after a change. */
  private async summarize(postId: string, myReaction: string | null): Promise<ReactionResult> {
    const post = await this.postRepository.findById(postId)
    const counts: Record<string, number> = {}

    if (post?.reactionCounts) {
      for (const [key, value] of post.reactionCounts.entries()) {
        if (value > 0) counts[key] = value
      }
    }

    return {
      reactions: counts,
      reactionTotal: Object.values(counts).reduce((sum, n) => sum + n, 0),
      myReaction,
    }
  }

  /**
   * Sets, switches, or clears the viewer's reaction on a post.
   *
   * Reacting with the type you already have removes it, which is how a
   * like button is expected to behave. The denormalized counters on the post
   * are adjusted with $inc so two concurrent reactions cannot lose one.
   */
  async toggle(postId: string, userId: string, type: ReactionEnum): Promise<ReactionResult> {
    const post = await this.postRepository.findOne({
      _id: postId,
      deletedAt: { $exists: false },
    })
    if (!post) throw new NotFoundException('Post not found')

    const existing = await this.reactionRepository.findOne({ post: postId, user: userId })

    // Same reaction again: treat it as an undo.
    if (existing && existing.type === type) {
      await this.reactionRepository.deleteOne({ _id: existing._id })
      await this.postRepository.updateOne(
        { _id: postId },
        { $inc: { [`reactionCounts.${type}`]: -1 } },
      )
      return this.summarize(postId, null)
    }

    if (existing) {
      // Switching type: move the count from the old bucket to the new one.
      const previous = existing.type
      existing.type = type
      await existing.save()
      await this.postRepository.updateOne(
        { _id: postId },
        { $inc: { [`reactionCounts.${previous}`]: -1, [`reactionCounts.${type}`]: 1 } },
      )
      return this.summarize(postId, type)
    }

    await this.reactionRepository.create({ post: postId, user: userId, type })
    await this.postRepository.updateOne(
      { _id: postId },
      { $inc: { [`reactionCounts.${type}`]: 1 } },
    )

    await notificationService.create({
      recipient: post.author,
      actor: userId,
      type: NotificationEnum.REACTION,
      post: postId,
    })

    return this.summarize(postId, type)
  }

  /** Who reacted to a post, for the hover list. */
  async listForPost(postId: string, page: number, limit: number) {
    const result = await this.reactionRepository.paginate({
      filter: { post: postId },
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: 'user', select: 'name username photo' },
    })

    const { items, ...meta } = result

    return {
      items: items.map((row) => {
        const user = row.user as unknown as {
          _id: unknown
          name: string
          username: string
          photo?: string
        }
        return {
          type: row.type,
          user: {
            id: String(user._id),
            name: user.name,
            username: user.username,
            photo: user.photo ?? null,
          },
        }
      }),
      meta,
    }
  }
}

export const reactionService = new ReactionService()

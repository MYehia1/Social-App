import { NotificationEnum } from '../../common/enums'
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '../../common/exceptions'
import { resolveMentions } from '../../common/mentions'
import { CommentRepository, PostRepository } from '../../DB/repository'
import type { CommentDocument } from '../../DB/models'
import { notificationService } from '../notifications/notification.service'
import { toPublicComment } from './comment.mapper'

const AUTHOR_POPULATE = { path: 'author', select: 'name username photo' }

/**
 * How deep a reply chain may go.
 *
 * The tree itself is unbounded in the data model, but an unbounded chain is
 * unreadable and trivially abusable, so anything deeper attaches to the
 * deepest allowed ancestor instead of being rejected — the user still gets
 * their reply, it just stops indenting.
 */
const MAX_DEPTH = 2

class CommentService {
  private readonly commentRepository = new CommentRepository()
  private readonly postRepository = new PostRepository()

  /**
   * Validates a reply target and returns the comment it should hang off.
   *
   * A parent from a different post would silently corrupt the thread, so that
   * is rejected rather than clamped.
   */
  private async resolveParent(
    parentId: string,
    postId: string,
  ): Promise<CommentDocument> {
    const parent = await this.commentRepository.findOne({
      _id: parentId,
      deletedAt: { $exists: false },
    })

    if (!parent) throw new NotFoundException('That comment no longer exists')
    if (parent.post.toString() !== postId) {
      throw new BadRequestException('That comment belongs to a different post')
    }

    return parent
  }

  async create(
    authorId: string,
    postId: string,
    content: string,
    parentId?: string,
  ) {
    const post = await this.postRepository.findOne({
      _id: postId,
      deletedAt: { $exists: false },
    })
    if (!post) throw new NotFoundException('Post not found')

    const parent = parentId ? await this.resolveParent(parentId, postId) : null
    const mentions = await resolveMentions(content, authorId)

    const comment = await this.commentRepository.create({
      content,
      post: postId,
      author: authorId,
      mentions,
      ...(parent
        ? {
            parent: parent._id,
            // Clamped, so a long chain flattens rather than indenting forever.
            depth: Math.min((parent.depth ?? 0) + 1, MAX_DEPTH),
          }
        : { depth: 0 }),
    })

    await Promise.all([
      // The post counter covers replies too — they are still comments.
      this.postRepository.bumpCommentCount(postId, 1),
      parent ? this.commentRepository.bumpReplyCount(parent._id.toString(), 1) : null,
    ])

    // A reply notifies the comment author; a top-level comment notifies the
    // post author. `create` drops self-notifications, so replying to yourself
    // stays silent.
    const alreadyNotified = new Set<string>()

    if (parent) {
      await notificationService.create({
        recipient: parent.author,
        actor: authorId,
        type: NotificationEnum.REPLY,
        post: postId,
        comment: comment._id.toString(),
        excerpt: content,
      })
      alreadyNotified.add(parent.author.toString())
    } else {
      await notificationService.create({
        recipient: post.author,
        actor: authorId,
        type: NotificationEnum.COMMENT,
        post: postId,
        comment: comment._id.toString(),
        excerpt: content,
      })
      alreadyNotified.add(post.author.toString())
    }

    await notificationService.createMentions(
      // Skip anyone who already got a notification for this comment.
      mentions.filter((id) => !alreadyNotified.has(id.toString())),
      authorId,
      NotificationEnum.MENTION_COMMENT,
      { post: postId, comment: comment._id.toString(), excerpt: content },
    )

    await comment.populate(AUTHOR_POPULATE)
    return toPublicComment(comment)
  }

  private async findOwnedOrFail(id: string, userId: string): Promise<CommentDocument> {
    const comment = await this.commentRepository.findOne({
      _id: id,
      deletedAt: { $exists: false },
    })
    if (!comment) throw new NotFoundException('Comment not found')
    if (comment.author.toString() !== userId) {
      throw new ForbiddenException('You can only modify your own comments')
    }
    return comment
  }

  async update(id: string, userId: string, content: string) {
    const comment = await this.findOwnedOrFail(id, userId)
    comment.content = content
    comment.mentions = await resolveMentions(content, userId)
    await comment.save()
    await comment.populate(AUTHOR_POPULATE)
    return toPublicComment(comment)
  }

  /**
   * Soft-deletes a comment and everything beneath it.
   *
   * Leaving replies behind would orphan them into invisible sub-threads, so
   * the whole subtree goes, and the post counter drops by the full amount.
   */
  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.findOwnedOrFail(id, userId)
    const now = new Date()

    const descendants = await this.commentRepository.findDescendants(id)
    const ids = [comment._id, ...descendants.map((d) => d._id)]

    await this.commentRepository.softDeleteMany(ids, now)
    await this.postRepository.bumpCommentCount(comment.post.toString(), -ids.length)

    if (comment.parent) {
      await this.commentRepository.bumpReplyCount(comment.parent.toString(), -1)
    }
  }
}

export const commentService = new CommentService()

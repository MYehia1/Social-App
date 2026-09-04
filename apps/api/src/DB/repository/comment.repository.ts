import type { Types } from 'mongoose'
import { CommentModel } from '../models'
import type { IComment } from '../../common/interfaces'
import { DatabaseRepository } from './base.repository'

const AUTHOR_SELECT = 'name username photo'

export class CommentRepository extends DatabaseRepository<IComment> {
  constructor() {
    super(CommentModel)
  }

  /**
   * A post's visible comments, oldest first, with authors populated.
   *
   * Replies come back in the same flat list; the client assembles the tree
   * from `parentId`. One query beats one per nesting level.
   */
  findByPost(postId: string) {
    return this.model
      .find({ post: postId, deletedAt: { $exists: false } })
      .sort({ createdAt: 1 })
      // `username` is required for the profile link on each comment; without
      // it the mapper produced `/u/undefined`.
      .populate({ path: 'author', select: AUTHOR_SELECT })
  }

  bumpReplyCount(commentId: string, delta: number) {
    return this.model.updateOne({ _id: commentId }, { $inc: { replyCount: delta } })
  }

  /**
   * Every comment beneath this one, at any depth.
   *
   * Walks level by level rather than reaching for $graphLookup: depth is
   * capped when replies are created, so this is a couple of round trips at
   * most and stays readable.
   */
  async findDescendants(commentId: string): Promise<Array<{ _id: Types.ObjectId }>> {
    const all: Array<{ _id: Types.ObjectId }> = []
    let frontier = [commentId]

    while (frontier.length > 0) {
      const children = await this.model
        .find({ parent: { $in: frontier }, deletedAt: { $exists: false } })
        .select('_id')
        .lean()

      if (children.length === 0) break

      all.push(...children)
      frontier = children.map((child) => child._id.toString())
    }

    return all
  }

  softDeleteMany(ids: Types.ObjectId[], at: Date) {
    return this.model.updateMany({ _id: { $in: ids } }, { deletedAt: at })
  }
}

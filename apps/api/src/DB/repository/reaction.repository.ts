import { ReactionModel } from '../models'
import type { IReaction } from '../../common/interfaces'
import { DatabaseRepository } from './base.repository'

export class ReactionRepository extends DatabaseRepository<IReaction> {
  constructor() {
    super(ReactionModel)
  }

  /**
   * Fetches one viewer's reactions across a page of posts in a single query,
   * so rendering a feed does not cost one lookup per row.
   */
  findForUser(postIds: string[], userId: string) {
    return this.model
      .find({ post: { $in: postIds }, user: userId })
      .select('post type')
      .lean()
  }
}

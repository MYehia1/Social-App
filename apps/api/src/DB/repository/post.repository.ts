import { PostModel } from '../models'
import type { IPost } from '../../common/interfaces'
import { DatabaseRepository } from './base.repository'

export class PostRepository extends DatabaseRepository<IPost> {
  constructor() {
    super(PostModel)
  }

  /** Keeps the comment counter in step without re-counting the collection. */
  bumpCommentCount(postId: string, delta: number) {
    return this.model.updateOne({ _id: postId }, { $inc: { commentCount: delta } })
  }
}

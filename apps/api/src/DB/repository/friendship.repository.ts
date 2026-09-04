import { FriendshipModel } from '../models'
import { FriendshipStatusEnum } from '../../common/enums'
import type { IFriendship } from '../../common/interfaces'
import { DatabaseRepository } from './base.repository'

export class FriendshipRepository extends DatabaseRepository<IFriendship> {
  constructor() {
    super(FriendshipModel)
  }

  /** Finds the relationship between two users in either direction. */
  findBetween(a: string, b: string) {
    return this.model.findOne({
      $or: [
        { requester: a, recipient: b },
        { requester: b, recipient: a },
      ],
    })
  }

  /** Every relationship touching this user, in either direction. */
  findAllForUser(userId: string) {
    return this.model
      .find({ $or: [{ requester: userId }, { recipient: userId }] })
      .select('requester recipient')
      .lean()
  }

  /** Accepted friendships touching this user, ids only. */
  findAccepted(userId: string) {
    return this.model
      .find(this.acceptedFilter(userId))
      .select('requester recipient')
      .lean()
  }

  acceptedFilter(userId: string) {
    return {
      status: FriendshipStatusEnum.ACCEPTED,
      $or: [{ requester: userId }, { recipient: userId }],
    }
  }
}

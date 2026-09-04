import { UserModel } from '../models'
import type { IUser } from '../../common/interfaces'
import { DatabaseRepository } from './base.repository'

export class UserRepository extends DatabaseRepository<IUser> {
  constructor() {
    super(UserModel)
  }

  /** Password is `select: false`, so it must be asked for explicitly. */
  findByEmailWithPassword(email: string) {
    return this.model.findOne({ email: email.toLowerCase() }).select('+password')
  }

  findByEmail(email: string) {
    return this.model.findOne({ email: email.toLowerCase() })
  }

  /**
   * Pull-then-push, in that order, so re-enabling push in a browser that
   * already holds a token moves it to the end rather than storing it twice.
   * `$slice: -10` caps a user at ten devices, dropping the oldest — MongoDB
   * refuses `$pull` and `$push` on one field in a single update, hence two.
   */
  async addPushToken(userId: string, token: string): Promise<void> {
    await this.model.updateOne({ _id: userId }, { $pull: { pushTokens: token } })
    await this.model.updateOne(
      { _id: userId },
      { $push: { pushTokens: { $each: [token], $slice: -10 } } },
    )
  }

  removePushTokens(userId: string, tokens: string[]) {
    return this.model.updateOne(
      { _id: userId },
      { $pull: { pushTokens: { $in: tokens } } },
    )
  }

  /** Tokens are `select: false`, so they must be asked for explicitly. */
  async findPushTokens(userId: string): Promise<string[]> {
    const user = await this.model
      .findById(userId)
      .select('+pushTokens')
      .lean<{ pushTokens?: string[] } | null>()
    return user?.pushTokens ?? []
  }
}

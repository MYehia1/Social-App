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
}

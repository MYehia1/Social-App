import bcrypt from 'bcryptjs'
import { env } from '../../config/config'

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.SALT_ROUNDS)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  // bcrypt.compare is constant-time with respect to the hash, so it does not
  // leak how much of the password matched.
  return bcrypt.compare(plain, hash)
}

import type { NextFunction, Request, Response } from 'express'
import { ForbiddenException, UnauthorizedException } from '../common/exceptions'
import { verifyAccessToken } from '../common/security'
import { UserRepository } from '../DB/repository'
import type { RoleEnum } from '../common/enums'
import type { UserDocument } from '../DB/models'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserDocument
    }
  }
}

const userRepository = new UserRepository()

/** Requires a valid, non-stale access token and attaches the user. */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedException('Sign in to continue')
  }

  const payload = verifyAccessToken(header.slice('Bearer '.length))
  const user = await userRepository.findById(payload.sub)

  if (!user) throw new UnauthorizedException('Account not found')

  // A password change invalidates every token issued before it, which is what
  // makes "sign out everywhere" work without server-side session storage.
  if (user.credentialsChangedAt) {
    const changedAtSeconds = Math.floor(user.credentialsChangedAt.getTime() / 1000)
    if (payload.iat < changedAtSeconds) {
      throw new UnauthorizedException('Your session has expired. Sign in again.')
    }
  }

  req.user = user
  next()
}

/** Route guard for role-restricted endpoints. */
export function authorize(...roles: RoleEnum[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedException('Sign in to continue')
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenException('You do not have access to this')
    }
    next()
  }
}

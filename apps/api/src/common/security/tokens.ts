import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '../../config/config'
import { UnauthorizedException } from '../exceptions'

export interface AccessTokenPayload {
  sub: string
  role: string
  /** Issued-at, in seconds. Compared against the user's credentialsChangedAt. */
  iat: number
}

export interface RefreshTokenPayload {
  sub: string
  /** Token id, so a specific refresh token can be revoked. */
  jti: string
  iat: number
}

export function signAccessToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  } as SignOptions)
}

export function signRefreshToken(userId: string, jti: string): string {
  return jwt.sign({ sub: userId, jti }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`,
  } as SignOptions)
}

function verify<T>(token: string, secret: string): T {
  try {
    return jwt.verify(token, secret) as T
  } catch (error) {
    // Never surface the underlying jwt error text — it distinguishes
    // "malformed" from "expired" from "bad signature" to an attacker.
    throw new UnauthorizedException('Your session has expired. Sign in again.', error)
  }
}

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  verify<AccessTokenPayload>(token, env.ACCESS_TOKEN_SECRET)

export const verifyRefreshToken = (token: string): RefreshTokenPayload =>
  verify<RefreshTokenPayload>(token, env.REFRESH_TOKEN_SECRET)

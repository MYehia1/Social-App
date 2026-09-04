import type { CookieOptions, Response } from 'express'
import { env, isProduction } from '../../config/config'

export const REFRESH_COOKIE = 'echoo_rt'

/**
 * The refresh token lives in an httpOnly cookie so JavaScript — and therefore
 * any XSS on the page — cannot read it. Only the short-lived access token is
 * ever handed to the client.
 *
 * In production the API and the web app are on different domains, so the
 * cookie must be SameSite=None, which browsers only accept alongside Secure.
 */
function options(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/v1/auth',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  }
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, options())
}

export function clearRefreshCookie(res: Response): void {
  const { maxAge: _maxAge, ...rest } = options()
  res.clearCookie(REFRESH_COOKIE, rest)
}

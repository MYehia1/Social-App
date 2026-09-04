import { Router, type Request, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import { successResponse } from '../../common/response'
import { asyncHandler, authenticate, validate } from '../../middleware'
import { authService } from './auth.service'
import { googleAuthService } from './google.service'
import type {
  ChangePasswordDto,
  LoginDto,
  ResendOtpDto,
  SignupDto,
  VerifyOtpDto,
} from './auth.dto'
import { toPublicUser } from './auth.mapper'
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from './auth.cookies'
import {
  changePasswordSchema,
  loginSchema,
  resendOtpSchema,
  signupSchema,
  googleSchema,
  verifyOtpSchema,
} from './auth.validation'

const router: Router = Router()

/**
 * Credential endpoints get a much tighter budget than the rest of the API.
 *
 * Only FAILED attempts count against the limit. Brute force is a stream of
 * failures, so counting successes too would punish legitimate traffic — a
 * handful of people behind one NAT (or one office, or a shared demo link)
 * would lock each other out without an attacker being involved.
 */
const failedAttemptsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 429,
    error: { message: 'Too many attempts. Try again in a few minutes.', code: 'RATE_LIMITED' },
  },
})

/** A plain ceiling for the Google route, where every call is expected to succeed. */
const credentialsBurst = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 429,
    error: { message: 'Too many attempts. Try again shortly.', code: 'RATE_LIMITED' },
  },
})

/** Account creation is capped separately — it is never high-frequency. */
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 429,
    error: { message: 'Too many accounts created. Try again later.', code: 'RATE_LIMITED' },
  },
})

router.post(
  '/signup',
  signupLimiter,
  validate(signupSchema),
  asyncHandler(async (req: Request, res: Response) => {
    // No session yet — the emailed code has to be confirmed first.
    const { email, expiresAt } = await authService.signup(req.body as SignupDto)
    return successResponse({
      res,
      status: 201,
      message: 'Check your email for a verification code',
      data: { email, expiresAt, requiresVerification: true },
    })
  }),
)

router.post(
  '/verify',
  failedAttemptsLimiter,
  validate(verifyOtpSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, code } = req.body as VerifyOtpDto
    const { user, accessToken, refreshToken } = await authService.verifyOtp(email, code)
    setRefreshCookie(res, refreshToken)
    return successResponse({
      res,
      message: 'Email verified',
      data: { user, accessToken },
    })
  }),
)

router.post(
  '/resend-code',
  signupLimiter,
  validate(resendOtpSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { expiresAt } = await authService.resendOtp((req.body as ResendOtpDto).email)
    // Always the same reply, so this cannot enumerate registered addresses.
    return successResponse({
      res,
      message: 'If that account exists, a new code is on its way',
      data: { expiresAt },
    })
  }),
)

router.post(
  '/login',
  failedAttemptsLimiter,
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body as LoginDto)
    setRefreshCookie(res, refreshToken)
    return successResponse({ res, message: 'Signed in', data: { user, accessToken } })
  }),
)

router.post(
  '/google',
  credentialsBurst,
  validate(googleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await googleAuthService.authenticate(
      (req.body as { idToken: string }).idToken,
    )
    const { accessToken, refreshToken, user: publicUser } =
      authService.issueTokens(user)
    setRefreshCookie(res, refreshToken)
    return successResponse({
      res,
      message: 'Signed in with Google',
      data: { user: publicUser, accessToken },
    })
  }),
)

router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const cookies = req.cookies as Record<string, string | undefined>
    const { accessToken } = await authService.refresh(cookies[REFRESH_COOKIE])
    return successResponse({ res, message: 'Token refreshed', data: { accessToken } })
  }),
)

router.post('/logout', (_req: Request, res: Response) => {
  clearRefreshCookie(res)
  return successResponse({ res, message: 'Signed out' })
})

router.get(
  '/me',
  asyncHandler(authenticate),
  (req: Request, res: Response) =>
    successResponse({ res, data: { user: toPublicUser(req.user!) } }),
)

router.patch(
  '/password',
  failedAttemptsLimiter,
  asyncHandler(authenticate),
  validate(changePasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await authService.changePassword(
      req.user!._id.toString(),
      req.body as ChangePasswordDto,
    )
    setRefreshCookie(res, refreshToken)
    return successResponse({
      res,
      message: 'Password changed',
      data: { user, accessToken },
    })
  }),
)

export default router

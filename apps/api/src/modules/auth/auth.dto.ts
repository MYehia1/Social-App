import type { z } from 'zod'
import type {
  changePasswordSchema,
  loginSchema,
  resendOtpSchema,
  signupSchema,
  verifyOtpSchema,
} from './auth.validation'

export type SignupDto = z.infer<typeof signupSchema.body>
export type LoginDto = z.infer<typeof loginSchema.body>
export type ChangePasswordDto = z.infer<typeof changePasswordSchema.body>
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema.body>
export type ResendOtpDto = z.infer<typeof resendOtpSchema.body>

export interface PublicUser {
  id: string
  name: string
  username: string
  email: string
  photo: string | null
  /** Newest first. Empty when the account has never set one. */
  coverPhotos: string[]
  /** The newest cover, or null. Convenience for single-image contexts. */
  coverPhoto: string | null
  bio: string | null
  friendCount: number
  gender: string
  role: string
  dateOfBirth: string | null
  createdAt: string | null
}

export interface AuthResult {
  user: PublicUser
  accessToken: string
  refreshToken: string
}

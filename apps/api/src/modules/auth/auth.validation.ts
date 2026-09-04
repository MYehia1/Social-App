import { z } from 'zod'
import { GenderEnum } from '../../common/enums'
import { generalValidation } from '../../common/validation'

export const signupSchema = {
  body: z
    .object({
      name: generalValidation.name,
      email: generalValidation.email,
      password: generalValidation.password,
      rePassword: z.string(),
      dateOfBirth: generalValidation.dateOfBirth,
      gender: z.enum(GenderEnum),
    })
    .refine((data) => data.password === data.rePassword, {
      message: 'Passwords do not match',
      path: ['rePassword'],
    }),
}

export const loginSchema = {
  body: z.object({
    email: generalValidation.email,
    // Deliberately not the strict password rule: existing accounts may
    // predate it, and echoing the rule back on sign-in helps an attacker.
    password: z.string().min(1, 'Password is required'),
  }),
}

export const verifyOtpSchema = {
  body: z.object({
    email: generalValidation.email,
    code: z
      .string()
      .trim()
      .regex(/^[0-9]{6}$/, 'Enter the six-digit code'),
  }),
}

export const resendOtpSchema = {
  body: z.object({ email: generalValidation.email }),
}

export const googleSchema = {
  body: z.object({ idToken: z.string().min(1, 'Missing Google credential') }),
}

export const changePasswordSchema = {
  body: z
    .object({
      password: z.string().min(1, 'Current password is required'),
      newPassword: generalValidation.password,
    })
    .refine((data) => data.password !== data.newPassword, {
      message: 'New password must be different from the current one',
      path: ['newPassword'],
    }),
}

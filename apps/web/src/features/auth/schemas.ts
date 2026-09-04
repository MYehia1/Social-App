import { z } from 'zod'

const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[A-Z]/, 'Add at least one uppercase letter')
  .regex(/[a-z]/, 'Add at least one lowercase letter')
  .regex(/[0-9]/, 'Add at least one number')
  .regex(/[#?!@$%^&*-]/, 'Add at least one special character (#?!@$%^&*-)')

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),

  password: z.string().min(1, 'Enter your password'),
})

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Enter your name')
      .max(20, 'Keep it under 20 characters'),
    email: z.email('Enter a valid email address'),
    password,
    rePassword: z.string().min(1, 'Confirm your password'),
    dateOfBirth: z
      .string()
      .min(1, 'Choose your date of birth')
      .refine((value) => {
        const date = new Date(value)
        return !Number.isNaN(date.getTime()) && date < new Date()
      }, 'Date of birth must be in the past'),
    gender: z.enum(['male', 'female'], { message: 'Choose an option' }),
  })
  .refine((values) => values.password === values.rePassword, {
    message: 'Passwords do not match',
    path: ['rePassword'],
  })

export const changePasswordSchema = z
  .object({
    password: z.string().min(1, 'Enter your current password'),
    newPassword: password,
  })
  .refine((values) => values.password !== values.newPassword, {
    message: 'Choose a password different from your current one',
    path: ['newPassword'],
  })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>

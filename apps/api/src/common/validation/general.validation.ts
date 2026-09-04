import { z } from 'zod'

/** Shared field rules, so the same constraint is never written twice. */
export const generalValidation = {
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),

  email: z.email('Enter a valid email address').toLowerCase().trim(),

  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Use only letters, numbers and underscores'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(64, 'Password must be at most 64 characters')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[#?!@$%^&*-]/, 'Password must contain a special character (#?!@$%^&*-)'),

  dateOfBirth: z.coerce
    .date()
    .refine((date) => date < new Date(), 'Date of birth must be in the past')
    .refine(
      (date) => date > new Date('1900-01-01'),
      'Enter a realistic date of birth',
    ),

  objectId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier'),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
}

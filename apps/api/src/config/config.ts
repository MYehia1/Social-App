import { config } from 'dotenv'
import { resolve } from 'node:path'
import { z } from 'zod'

// Load `.env.<NODE_ENV>` when present, then plain `.env` as a fallback so a
// single-file setup (which is what most hosts give you) also works.
const environment = process.env.NODE_ENV ?? 'development'
config({ path: resolve(process.cwd(), `.env.${environment}`), quiet: true })
config({ path: resolve(process.cwd(), '.env'), quiet: true })

/**
 * Every environment variable the API needs, validated at boot.
 *
 * Previously these were read with `process.env.X as string`, so a missing
 * secret became the string "undefined" and surfaced much later as a confusing
 * runtime failure — for example JWTs silently signed with an undefined key.
 * Failing here, loudly, is far cheaper.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DB_URI: z.string().min(1, 'DB_URI is required'),

  SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  ACCESS_TOKEN_SECRET: z.string().min(32, 'ACCESS_TOKEN_SECRET must be at least 32 characters'),
  REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

  // Comma-separated list of allowed browser origins.
  ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)),

  // Image uploads are disabled unless all three are present.
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Google Identity Services. Public by design — it ships in the web bundle.
  GOOGLE_CLIENT_ID: z.string().optional(),

  // Email delivery for signup verification codes. Without these the API
  // logs codes to the console in development and refuses to send in production.
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().default('Echoo <no-reply@echoo.app>'),

  DEMO_EMAIL: z.string().optional(),
  DEMO_PASSWORD: z.string().optional(),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  console.error(`\nInvalid environment configuration:\n${issues}\n`)
  process.exit(1)
}

export const env = parsed.data

export const isProduction = env.NODE_ENV === 'production'

export const uploadsEnabled = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
)

export const mailEnabled = Boolean(env.SMTP_USER && env.SMTP_PASSWORD)

export const googleAuthEnabled = Boolean(env.GOOGLE_CLIENT_ID)

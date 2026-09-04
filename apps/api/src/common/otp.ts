import { createHash, randomInt } from 'node:crypto'

/** How long a verification code stays valid. */
export const OTP_TTL_MS = 2 * 60 * 1000

/** Maximum wrong guesses before the code is burned and must be re-sent. */
export const OTP_MAX_ATTEMPTS = 3

/** A six-digit code from a cryptographically secure source. */
export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}

/**
 * Codes are stored hashed, never in plaintext.
 *
 * A plain SHA-256 is the right tool here rather than bcrypt: the input space
 * is only a million values, so a slow hash buys nothing an attacker cannot
 * brute-force offline anyway. The real protections are the two-minute expiry
 * and the three-attempt counter.
 */
export function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export function otpMatches(code: string, hash: string): boolean {
  return hashOtp(code) === hash
}

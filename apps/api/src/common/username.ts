import { UserModel } from '../DB/models'

/**
 * Derives a unique @handle from a display name.
 *
 * Signup does not ask for a username, so one is generated and the user can
 * change it later from their profile. A numeric suffix is appended until the
 * handle is free; the unique index on the column is still the real guarantee.
 */
export async function generateUsername(name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .normalize('NFD')
      // Strip accents, then anything that is not a legal handle character.
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 15) || 'user'

  // Pad short bases so the result always clears the 3-character minimum.
  const seed = base.length >= 3 ? base : `${base}_user`.slice(0, 15)

  if (!(await UserModel.exists({ username: seed }))) return seed

  for (let suffix = 1; suffix < 1000; suffix += 1) {
    const candidate = `${seed.slice(0, 20 - String(suffix).length)}${suffix}`
    if (!(await UserModel.exists({ username: candidate }))) return candidate
  }

  // Effectively unreachable, but never hand back a colliding handle.
  return `user_${Date.now().toString(36).slice(-8)}`
}

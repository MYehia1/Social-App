import { UserModel } from '../DB/models'
import type { Types } from 'mongoose'

/** Matches @handle, using the same character set the username field allows. */
const MENTION_PATTERN = /@([a-z0-9_]{3,20})/gi

/** Pulls the distinct handles out of a body of text. */
export function extractHandles(text: string): string[] {
  const handles = new Set<string>()
  for (const match of text.matchAll(MENTION_PATTERN)) {
    if (match[1]) handles.add(match[1].toLowerCase())
  }
  return [...handles]
}

/**
 * Resolves @handles to real user ids, dropping any that do not exist.
 *
 * Mentions are stored as ids rather than raw text so a later username change
 * does not silently break the link.
 */
export async function resolveMentions(
  text: string,
  excludeUserId?: string,
): Promise<Types.ObjectId[]> {
  const handles = extractHandles(text)
  if (handles.length === 0) return []

  // Cap the lookup so a body full of @s cannot become an expensive query.
  const users = await UserModel.find({ username: { $in: handles.slice(0, 20) } })
    .select('_id')
    .lean()

  return users
    .map((user) => user._id)
    .filter((id) => id.toString() !== excludeUserId)
}

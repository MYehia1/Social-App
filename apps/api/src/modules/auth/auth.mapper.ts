import type { UserDocument } from '../../DB/models'
import type { PublicUser } from './auth.dto'

/**
 * Cover photos newest-first, folding in the legacy single cover.
 *
 * Accounts created before covers became an array still carry `coverPhoto`, so
 * it is appended as the oldest entry rather than migrated in a batch job —
 * the read path is the only place that needs to know both shapes exist.
 */
function coverUrls(user: UserDocument): string[] {
  const urls = (user.covers ?? []).map((cover) => cover.url)
  if (user.coverPhoto && !urls.includes(user.coverPhoto)) urls.push(user.coverPhoto)
  return urls
}

/** The only shape a user is ever serialized into for a client. */
export function toPublicUser(user: UserDocument): PublicUser {
  const covers = coverUrls(user)

  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    photo: user.photo ?? null,
    coverPhotos: covers,
    // The newest cover, for anything that only wants one.
    coverPhoto: covers[0] ?? null,
    bio: user.bio ?? null,
    friendCount: user.friendCount ?? 0,
    gender: user.gender,
    role: user.role,
    dateOfBirth: user.dateOfBirth?.toISOString() ?? null,
    createdAt: user.createdAt?.toISOString() ?? null,
  }
}

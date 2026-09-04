import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { BadRequestException, NotFoundException } from '../../common/exceptions'
import { successResponse } from '../../common/response'
import { deleteImage, uploadImage } from '../../common/storage'
import { generalValidation } from '../../common/validation'
import { asyncHandler, authenticate, validate } from '../../middleware'
import { singleImage } from '../../middleware/upload.middleware'
import { UserModel } from '../../DB/models'
import { UserRepository } from '../../DB/repository'
import { toPublicUser } from '../auth/auth.mapper'
import { friendService } from '../friends/friend.service'
import { toPublicAuthor } from '../posts/post.mapper'

const router: Router = Router()
const userRepository = new UserRepository()

router.use(asyncHandler(authenticate))

const searchSchema = {
  query: z.object({
    // Empty is allowed: typing a bare "@" should offer your friends straight
    // away rather than waiting for a first character.
    q: z.string().trim().max(30).default(''),
    limit: z.coerce.number().int().min(1).max(10).default(6),
  }),
}

const updateSchema = {
  body: z.object({
    name: generalValidation.name.optional(),
    username: generalValidation.username.optional(),
    bio: z.string().trim().max(160).optional(),
  }),
}

const usernameParam = {
  params: z.object({ username: z.string().trim().min(3).max(20) }),
}

/**
 * Typeahead for the @mention picker.
 *
 * Friends come first, and an empty term returns friends only — mentioning
 * someone you know is overwhelmingly the common case, so a bare "@" is
 * immediately useful instead of waiting for a first keystroke.
 *
 * Matching is anchored to the start of the handle or name, so the query uses
 * the username index rather than scanning every user.
 */
router.get(
  '/search',
  validate(searchSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { q, limit } = req.query as unknown as { q: string; limit: number }
    const friendIds = await friendService.friendIds(req.user!._id.toString())

    // Escape regex metacharacters — the term comes straight from the user.
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = safe
      ? {
          $or: [
            { username: new RegExp(`^${safe}`, 'i') },
            { name: new RegExp(`^${safe}`, 'i') },
          ],
        }
      : {}

    const friends = await UserModel.find({ ...match, _id: { $in: friendIds } })
      .select('name username photo')
      .limit(limit)

    // Only reach past your friends when there is a term to match on and room
    // left in the list.
    const remaining = limit - friends.length
    const others =
      safe && remaining > 0
        ? await UserModel.find({
            ...match,
            _id: { $nin: [...friendIds, req.user!._id] },
          })
            .select('name username photo')
            .limit(remaining)
        : []

    return successResponse({
      res,
      data: [
        ...friends.map((user) => ({ ...toPublicAuthor(user), isFriend: true })),
        ...others.map((user) => ({ ...toPublicAuthor(user), isFriend: false })),
      ],
    })
  }),
)

router.patch(
  '/me',
  validate(updateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const updates = req.body as { name?: string; username?: string; bio?: string }
    const user = req.user!

    if (updates.username && updates.username !== user.username) {
      const taken = await userRepository.exists({ username: updates.username })
      if (taken) throw new BadRequestException('That username is already taken')
      user.username = updates.username
    }
    if (updates.name) user.name = updates.name
    if (updates.bio !== undefined) user.bio = updates.bio

    await user.save()
    return successResponse({ res, message: 'Profile updated', data: { user: toPublicUser(user) } })
  }),
)

/** The avatar replaces the previous one outright. */
const avatarUpload = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new BadRequestException('Choose an image first')

  const user = req.user!
  const previousId = user.photoPublicId

  const uploaded = await uploadImage(req.file.buffer, 'avatars')
  user.photo = uploaded.url
  user.photoPublicId = uploaded.publicId
  await user.save()

  // Remove the old asset only after the new one is safely persisted.
  if (previousId) await deleteImage(previousId)

  return successResponse({
    res,
    message: 'Photo updated',
    data: { user: toPublicUser(user) },
  })
})

/**
 * How many covers an account keeps.
 *
 * Unbounded history would grow the document and the Cloudinary bill forever
 * for a feature nobody scrolls back through; six is enough to flip between
 * without it becoming an archive.
 */
const MAX_COVERS = 6

/**
 * A cover is added to the front of the history rather than replacing it, so
 * the newest shows by default and the earlier ones stay reachable.
 */
const coverUpload = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new BadRequestException('Choose an image first')

  const user = req.user!
  const uploaded = await uploadImage(req.file.buffer, 'covers')

  // Fold a legacy single cover into the array the first time this runs, so an
  // older account does not silently lose the cover it already had. The public
  // id is NOT required to keep the image: some legacy rows hold a URL with no
  // id, and gating on the id would have dropped exactly the covers this fold-in
  // exists to preserve. An empty id simply means the asset cannot be deleted
  // from Cloudinary when it is eventually evicted, which `deleteImage` skips.
  const existing = [...(user.covers ?? [])]
  if (user.coverPhoto && !existing.some((c) => c.url === user.coverPhoto)) {
    existing.push({ url: user.coverPhoto, publicId: user.coverPhotoPublicId ?? '' })
  }

  const next = [{ url: uploaded.url, publicId: uploaded.publicId }, ...existing]
  const evicted = next.slice(MAX_COVERS)

  user.covers = next.slice(0, MAX_COVERS)
  user.coverPhoto = undefined
  user.coverPhotoPublicId = undefined
  await user.save()

  // Only bin the assets that fell off the end, and only once the new state is
  // persisted — a failed delete must not cost the user their cover. Entries
  // folded in from a legacy row may carry no public id; there is nothing to
  // delete for those.
  for (const cover of evicted) {
    if (cover.publicId) await deleteImage(cover.publicId)
  }

  return successResponse({
    res,
    message: 'Cover photo updated',
    data: { user: toPublicUser(user) },
  })
})

router.put('/me/photo', singleImage('photo'), avatarUpload)
router.put('/me/cover', singleImage('cover'), coverUpload)

/** A public profile, plus how the viewer relates to it. */
router.get(
  '/by-username/:username',
  validate(usernameParam),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await userRepository.findOne({
      username: (req.params.username as string).toLowerCase(),
    })
    if (!user) throw new NotFoundException('Account not found')

    const friendState = await friendService.stateBetween(
      req.user!._id.toString(),
      user._id.toString(),
    )

    return successResponse({
      res,
      data: { user: toPublicUser(user), friendState },
    })
  }),
)

export default router

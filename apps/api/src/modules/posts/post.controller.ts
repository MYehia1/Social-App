import { Router, type Request, type Response } from 'express'
import { successResponse } from '../../common/response'
import { asyncHandler, authenticate, validate } from '../../middleware'
import { mediaFrom, postMedia } from '../../middleware/upload.middleware'
import { postService } from './post.service'
import {
  createPostSchema,
  listPostsSchema,
  postIdSchema,
  updatePostSchema,
  userPostsSchema,
} from './post.validation'

const router: Router = Router()

// Everything below requires a signed-in user.
router.use(asyncHandler(authenticate))

const me = (req: Request) => req.user!._id.toString()
const paging = (req: Request) => req.query as unknown as { page: number; limit: number }

router.get(
  '/',
  validate(listPostsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = paging(req)
    const { items, meta } = await postService.feed(page, limit, me(req))
    return successResponse({ res, data: items, meta })
  }),
)

/**
 * Posts the signed-in user was @mentioned in.
 * Declared before `/:id` so "mentions" is not parsed as an id.
 */
router.get(
  '/mentions',
  validate(listPostsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = paging(req)
    const { items, meta } = await postService.mentioning(me(req), page, limit)
    return successResponse({ res, data: items, meta })
  }),
)

router.get(
  '/:id',
  validate(postIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await postService.detail(req.params.id as string, me(req))
    return successResponse({ res, data })
  }),
)

router.post(
  '/',
  // Multer must run before validation so `req.body` is populated from the
  // multipart payload rather than being empty.
  postMedia(),
  validate(createPostSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const post = await postService.create(
      me(req),
      (req.body as { body: string }).body,
      mediaFrom(req),
    )
    return successResponse({ res, status: 201, message: 'Post created', data: post })
  }),
)

router.patch(
  '/:id',
  postMedia(),
  validate(updatePostSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const post = await postService.update(
      req.params.id as string,
      me(req),
      (req.body as { body: string }).body,
      mediaFrom(req),
    )
    return successResponse({ res, message: 'Post updated', data: post })
  }),
)

router.delete(
  '/:id',
  validate(postIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await postService.remove(req.params.id as string, me(req))
    return successResponse({ res, message: 'Post deleted' })
  }),
)

export const userPostsRouter: Router = Router()

userPostsRouter.get(
  '/:userId/posts',
  asyncHandler(authenticate),
  validate(userPostsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = paging(req)
    const { items, meta } = await postService.byAuthor(
      req.params.userId as string,
      page,
      limit,
      me(req),
    )
    return successResponse({ res, data: items, meta })
  }),
)

export default router

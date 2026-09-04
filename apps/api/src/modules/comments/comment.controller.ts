import { Router, type Request, type Response } from 'express'
import { successResponse } from '../../common/response'
import { asyncHandler, authenticate, validate } from '../../middleware'
import { commentService } from './comment.service'
import {
  commentIdSchema,
  createCommentSchema,
  updateCommentSchema,
} from './comment.validation'

const router: Router = Router()

router.use(asyncHandler(authenticate))

router.post(
  '/',
  validate(createCommentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { content, post, parent } = req.body as {
      content: string
      post: string
      parent?: string
    }
    const comment = await commentService.create(
      req.user!._id.toString(),
      post,
      content,
      parent,
    )
    return successResponse({ res, status: 201, message: 'Comment added', data: comment })
  }),
)

router.patch(
  '/:id',
  validate(updateCommentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const comment = await commentService.update(
      req.params.id as string,
      req.user!._id.toString(),
      (req.body as { content: string }).content,
    )
    return successResponse({ res, message: 'Comment updated', data: comment })
  }),
)

router.delete(
  '/:id',
  validate(commentIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await commentService.remove(req.params.id as string, req.user!._id.toString())
    return successResponse({ res, message: 'Comment deleted' })
  }),
)

export default router

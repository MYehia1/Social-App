import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { ReactionEnum } from '../../common/enums'
import { generalValidation } from '../../common/validation'
import { successResponse } from '../../common/response'
import { asyncHandler, authenticate, validate } from '../../middleware'
import { reactionService } from './reaction.service'

const router: Router = Router()

router.use(asyncHandler(authenticate))

const toggleSchema = {
  params: z.object({ postId: generalValidation.objectId }),
  body: z.object({ type: z.enum(ReactionEnum) }),
}

const listSchema = {
  params: z.object({ postId: generalValidation.objectId }),
  query: z.object({ page: generalValidation.page, limit: generalValidation.limit }),
}

router.put(
  '/:postId',
  validate(toggleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await reactionService.toggle(
      req.params.postId as string,
      req.user!._id.toString(),
      (req.body as { type: ReactionEnum }).type,
    )
    return successResponse({ res, message: 'Reaction saved', data: result })
  }),
)

router.get(
  '/:postId',
  validate(listSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number }
    const { items, meta } = await reactionService.listForPost(
      req.params.postId as string,
      page,
      limit,
    )
    return successResponse({ res, data: items, meta })
  }),
)

export default router

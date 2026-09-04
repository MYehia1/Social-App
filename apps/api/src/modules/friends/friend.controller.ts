import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { generalValidation } from '../../common/validation'
import { successResponse } from '../../common/response'
import { asyncHandler, authenticate, validate } from '../../middleware'
import { friendService } from './friend.service'

const router: Router = Router()

router.use(asyncHandler(authenticate))

const pageSchema = {
  query: z.object({ page: generalValidation.page, limit: generalValidation.limit }),
}
const userIdSchema = {
  params: z.object({ userId: generalValidation.objectId }),
}
const requestIdSchema = {
  params: z.object({ id: generalValidation.objectId }),
  body: z.object({ accept: z.boolean() }),
}

const me = (req: Request) => req.user!._id.toString()
const paging = (req: Request) => req.query as unknown as { page: number; limit: number }

router.get(
  '/',
  validate(pageSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = paging(req)
    const { items, meta } = await friendService.listFriends(me(req), page, limit)
    return successResponse({ res, data: items, meta })
  }),
)

router.get(
  '/requests/incoming',
  validate(pageSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = paging(req)
    const { items, meta } = await friendService.listIncoming(me(req), page, limit)
    return successResponse({ res, data: items, meta })
  }),
)

router.get(
  '/requests/outgoing',
  validate(pageSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = paging(req)
    const { items, meta } = await friendService.listOutgoing(me(req), page, limit)
    return successResponse({ res, data: items, meta })
  }),
)

/** People to add, for the discovery panel. */
router.get(
  '/suggestions',
  asyncHandler(async (req: Request, res: Response) => {
    const data = await friendService.suggestions(me(req), 12)
    return successResponse({ res, data })
  }),
)

router.post(
  '/requests/:userId',
  validate(userIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await friendService.sendRequest(me(req), req.params.userId as string)
    return successResponse({ res, status: 201, message: 'Friend request sent', data })
  }),
)

router.patch(
  '/requests/:id',
  validate(requestIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { accept } = req.body as { accept: boolean }
    const data = await friendService.respond(req.params.id as string, me(req), accept)
    return successResponse({
      res,
      message: accept ? 'Friend request accepted' : 'Friend request declined',
      data,
    })
  }),
)

router.delete(
  '/:userId',
  validate(userIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await friendService.removeFriend(me(req), req.params.userId as string)
    return successResponse({ res, message: 'Friend removed', data })
  }),
)

export default router

import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { generalValidation } from '../../common/validation'
import { successResponse } from '../../common/response'
import { asyncHandler, authenticate, validate } from '../../middleware'
import { notificationService } from './notification.service'
import { toPublicNotification } from './notification.mapper'

const router: Router = Router()

router.use(asyncHandler(authenticate))

const listSchema = {
  query: z.object({ page: generalValidation.page, limit: generalValidation.limit }),
}

const idSchema = {
  params: z.object({ id: generalValidation.objectId }),
}

// FCM tokens are long opaque strings; the bounds only stop an obviously
// bogus body from reaching the database.
const tokenSchema = {
  body: z.object({ token: z.string().min(20).max(4096) }),
}

router.get(
  '/',
  validate(listSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number }
    const result = await notificationService.list(req.user!._id.toString(), page, limit)
    const { items, ...meta } = result
    return successResponse({ res, data: items.map(toPublicNotification), meta })
  }),
)

/** Polled by the header badge, so it stays a cheap count-only query. */
router.get(
  '/unread-count',
  asyncHandler(async (req: Request, res: Response) => {
    const count = await notificationService.unreadCount(req.user!._id.toString())
    return successResponse({ res, data: { count } })
  }),
)

/**
 * Registers this browser for push. Called after the user grants permission,
 * and again whenever Firebase rotates the token.
 */
router.post(
  '/push/subscribe',
  validate(tokenSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body as { token: string }
    await notificationService.subscribe(req.user!._id.toString(), token)
    return successResponse({ res, message: 'Push notifications enabled' })
  }),
)

router.delete(
  '/push/subscribe',
  validate(tokenSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body as { token: string }
    await notificationService.unsubscribe(req.user!._id.toString(), token)
    return successResponse({ res, message: 'Push notifications disabled' })
  }),
)

router.patch(
  '/read-all',
  asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markAllRead(req.user!._id.toString())
    return successResponse({ res, message: 'All notifications marked as read' })
  }),
)

router.patch(
  '/:id/read',
  validate(idSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markRead(
      req.params.id as string,
      req.user!._id.toString(),
    )
    return successResponse({ res, message: 'Marked as read' })
  }),
)

export default router

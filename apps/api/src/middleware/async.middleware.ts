import type { NextFunction, Request, RequestHandler, Response } from 'express'

/**
 * Express 5 forwards rejected promises to the error handler on its own, but
 * wrapping keeps the intent explicit and protects handlers that are invoked
 * outside the normal routing path.
 */
export const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    void Promise.resolve(handler(req, res, next)).catch(next)
  }

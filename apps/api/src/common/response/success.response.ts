import type { Response } from 'express'

/** The one success envelope every endpoint returns. */
export function successResponse<T>({
  res,
  data,
  message = 'Done',
  status = 200,
  meta,
}: {
  res: Response
  data?: T
  message?: string
  status?: number
  meta?: Record<string, unknown>
}): Response {
  return res.status(status).json({
    status,
    message,
    ...(data !== undefined ? { data } : {}),
    ...(meta ? { meta } : {}),
  })
}

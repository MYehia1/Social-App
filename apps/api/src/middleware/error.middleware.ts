import type { NextFunction, Request, Response } from 'express'
import { MongoServerError } from 'mongodb'
import { Error as MongooseError } from 'mongoose'
import { ApplicationException } from '../common/exceptions'
import { isProduction } from '../config/config'

interface ErrorBody {
  message: string
  code: string
  details?: unknown
  stack?: string
}

/**
 * Translates anything thrown in the app into one consistent response shape.
 *
 * The previous version returned `error.stack` and the raw error object to the
 * client in every environment, which leaked file paths, dependency versions
 * and sometimes query contents.
 */
export function globalErrorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error)
    return
  }

  let status = 500
  let body: ErrorBody = { message: 'Internal server error', code: 'INTERNAL_ERROR' }

  if (error instanceof ApplicationException) {
    status = error.statusCode
    body = {
      message: error.message,
      code: error.code,
      ...(error.cause ? { details: error.cause } : {}),
    }
  } else if (error instanceof MongooseError.CastError) {
    // A malformed ObjectId in the URL is a client mistake, not a server fault.
    status = 400
    body = { message: 'Malformed identifier', code: 'INVALID_ID' }
  } else if (error instanceof MongoServerError && error.code === 11000) {
    status = 409
    body = { message: 'That value is already taken', code: 'DUPLICATE_KEY' }
  } else if (error instanceof MongooseError.ValidationError) {
    status = 400
    body = {
      message: 'Check the highlighted fields and try again',
      code: 'VALIDATION_ERROR',
      details: Object.values(error.errors).map((issue) => issue.message),
    }
  }

  // Stack traces go to the server log, never to the client.
  if (status >= 500) {
    console.error(error)
  }
  if (!isProduction && error instanceof Error && error.stack) {
    body.stack = error.stack
  }

  res.status(status).json({ status, error: body })
}

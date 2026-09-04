import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'
import { BadRequestException } from '../common/exceptions'

type ValidatableKey = 'body' | 'params' | 'query' | 'headers'
export type ValidationSchema = Partial<Record<ValidatableKey, ZodType>>

export interface FieldIssue {
  field: string
  message: string
}

/**
 * Validates the named parts of a request and replaces them with the parsed
 * result, so handlers receive coerced, trimmed, strongly-typed values rather
 * than the raw strings Express hands over.
 */
export function validate(schema: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const issues: FieldIssue[] = []

    for (const key of Object.keys(schema) as ValidatableKey[]) {
      const shape = schema[key]
      if (!shape) continue

      const result = shape.safeParse(req[key])

      if (result.success) {
        // `req.query` is a getter in Express 5, so assign through defineProperty.
        Object.defineProperty(req, key, {
          value: result.data,
          writable: true,
          configurable: true,
        })
      } else {
        for (const issue of result.error.issues) {
          issues.push({
            // A flat dotted path is what react-hook-form's setError expects.
            field: [key === 'body' ? null : key, ...issue.path]
              .filter(Boolean)
              .join('.'),
            message: issue.message,
          })
        }
      }
    }

    if (issues.length > 0) {
      next(new BadRequestException('Check the highlighted fields and try again', issues))
      return
    }

    next()
  }
}

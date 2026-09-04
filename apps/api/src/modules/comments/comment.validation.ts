import { z } from 'zod'
import { generalValidation } from '../../common/validation'

const content = z
  .string()
  .trim()
  .min(1, 'Comment cannot be empty')
  .max(300, 'Comments must be 300 characters or fewer')

export const createCommentSchema = {
  body: z.object({
    content,
    post: generalValidation.objectId,
    /** Present when replying to another comment. */
    parent: generalValidation.objectId.optional(),
  }),
}

export const updateCommentSchema = {
  params: z.object({ id: generalValidation.objectId }),
  body: z.object({ content }),
}

export const commentIdSchema = {
  params: z.object({ id: generalValidation.objectId }),
}

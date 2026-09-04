import { z } from 'zod'
import { generalValidation } from '../../common/validation'

const body = z
  .string()
  .trim()
  .max(500, 'Posts must be 500 characters or fewer')
  .optional()
  .default('')

export const listPostsSchema = {
  query: z.object({ page: generalValidation.page, limit: generalValidation.limit }),
}

export const postIdSchema = {
  params: z.object({ id: generalValidation.objectId }),
}

export const userPostsSchema = {
  params: z.object({ userId: generalValidation.objectId }),
  query: z.object({ page: generalValidation.page, limit: generalValidation.limit }),
}

export const createPostSchema = {
  body: z.object({ body }),
}

export const updatePostSchema = {
  params: z.object({ id: generalValidation.objectId }),
  body: z.object({ body }),
}

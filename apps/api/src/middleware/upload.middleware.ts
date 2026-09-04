import multer, { MulterError } from 'multer'
import type { NextFunction, Request, Response } from 'express'
import { BadRequestException, PayloadTooLargeException } from '../common/exceptions'

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime'])

/**
 * Files are held in memory and streamed straight to Cloudinary, so nothing
 * untrusted is ever written to the server's disk.
 *
 * Multer applies one byte limit across every field, so it is set to the video
 * ceiling and the per-field image limit is enforced afterwards — otherwise a
 * 50 MB "image" would slip through.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_BYTES, files: 2 },
  fileFilter(_req, file, callback) {
    const allowed = file.fieldname === 'video' ? VIDEO_TYPES : IMAGE_TYPES
    if (!allowed.has(file.mimetype)) {
      callback(
        new BadRequestException(
          file.fieldname === 'video'
            ? 'Videos must be MP4, WebM or MOV'
            : 'Images must be JPEG, PNG, WebP or GIF',
        ),
      )
      return
    }
    callback(null, true)
  },
})

function normalize(error: unknown, next: NextFunction): void {
  if (error instanceof MulterError) {
    next(
      error.code === 'LIMIT_FILE_SIZE'
        ? new PayloadTooLargeException(
            `Videos must be ${MAX_VIDEO_BYTES / 1024 / 1024} MB or smaller`,
          )
        : new BadRequestException(error.message),
    )
    return
  }
  next(error)
}

/** Accepts a single optional image and normalizes multer errors. */
export function singleImage(field: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    upload.single(field)(req, res, (error: unknown) => {
      if (error) {
        normalize(error, next)
        return
      }
      if (req.file && req.file.size > MAX_IMAGE_BYTES) {
        next(new PayloadTooLargeException('Images must be 4 MB or smaller'))
        return
      }
      next()
    })
  }
}

/** Accepts an optional image and an optional video on the same request. */
export function postMedia() {
  const handler = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ])

  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, (error: unknown) => {
      if (error) {
        normalize(error, next)
        return
      }

      const files = req.files as Record<string, Express.Multer.File[]> | undefined
      const image = files?.image?.[0]

      // Multer's single limit covers video; images get the tighter cap here.
      if (image && image.size > MAX_IMAGE_BYTES) {
        next(new PayloadTooLargeException('Images must be 4 MB or smaller'))
        return
      }

      next()
    })
  }
}

/** Pulls the optional image/video out of a `postMedia()` request. */
export function mediaFrom(req: Request): {
  image?: Express.Multer.File | undefined
  video?: Express.Multer.File | undefined
} {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined
  return { image: files?.image?.[0], video: files?.video?.[0] }
}

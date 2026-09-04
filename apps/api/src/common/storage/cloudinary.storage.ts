import { v2 as cloudinary } from 'cloudinary'
import { env, uploadsEnabled } from '../../config/config'
import { ServiceUnavailableException } from '../exceptions'

if (uploadsEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME as string,
    api_key: env.CLOUDINARY_API_KEY as string,
    api_secret: env.CLOUDINARY_API_SECRET as string,
    secure: true,
  })
}

export interface StoredImage {
  url: string
  publicId: string
}

/**
 * Uploads an in-memory buffer to Cloudinary.
 *
 * Cloudinary does the resizing and format conversion, so the API never needs
 * an image-processing dependency of its own.
 */
export function uploadImage(buffer: Buffer, folder: string): Promise<StoredImage> {
  if (!uploadsEnabled) {
    throw new ServiceUnavailableException(
      'Image uploads are not configured on this server',
    )
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `echoo/${folder}`,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(new ServiceUnavailableException('That image could not be uploaded. Try a different file.', error))
          return
        }
        resolve({ url: result.secure_url, publicId: result.public_id })
      },
    )

    stream.end(buffer)
  })
}

/**
 * Uploads a video. Cloudinary transcodes it server-side, so the API never
 * needs an ffmpeg dependency of its own.
 */
export function uploadVideo(buffer: Buffer, folder: string): Promise<StoredImage> {
  if (!uploadsEnabled) {
    throw new ServiceUnavailableException(
      'Video uploads are not configured on this server',
    )
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `echoo/${folder}`,
        resource_type: 'video',
        transformation: [
          { width: 1280, height: 1280, crop: 'limit' },
          { quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(new ServiceUnavailableException('That video could not be uploaded. Try a different file.', error))
          return
        }
        resolve({ url: result.secure_url, publicId: result.public_id })
      },
    )

    stream.end(buffer)
  })
}

/** Best-effort cleanup; a failure here must not fail the request. */
async function destroy(publicId: string, resourceType: 'image' | 'video') {
  if (!uploadsEnabled) return
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  } catch {
    // An orphaned asset is not worth failing a delete or update over.
  }
}

export const deleteImage = (publicId: string): Promise<void> => destroy(publicId, 'image')
export const deleteVideo = (publicId: string): Promise<void> => destroy(publicId, 'video')

import { GetObjectCommand } from '@aws-sdk/client-s3'

import { env } from '@/config/env.js'
import { AppError } from '@/error/lib/AppError.js'
import { catchAsyncError } from '@/error/utils/catchError.js'
import { s3Client } from '@/lib/s3.js'

export const ImageService = {
  getImage: (imagePath: string) =>
    catchAsyncError(
      (async () => {
        const command = new GetObjectCommand({
          Bucket: env.S3_BUCKET_NAME,
          Key: imagePath
        })

        const response = await s3Client.send(command)

        if (!response.Body) throw new AppError('NOT_FOUND', 'Image not found')

        return {
          body: response.Body,
          contentType: response.ContentType || 'application/octet-stream',
          contentLength: response.ContentLength,
          lastModified: response.LastModified,
          etag: response.ETag
        }
      })()
    )
}

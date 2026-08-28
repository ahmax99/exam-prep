import 'server-only'
import { GetObjectCommand } from '@aws-sdk/client-s3'

import { env } from '@/config/env'
import { AppError } from '@/features/error/lib/AppError'
import { s3Client } from '@/lib/s3'

export const fetchImage = async (imagePath: string) => {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: imagePath
  })

  const response = await s3Client.send(command).catch((error: unknown) => {
    if (error instanceof Error && error.name === 'NoSuchKey')
      throw new AppError('NOT_FOUND', 'Image not found')
    throw error
  })

  if (!response.Body) throw new AppError('NOT_FOUND', 'Image not found')

  return {
    body: response.Body.transformToWebStream(),
    contentType: response.ContentType ?? 'application/octet-stream',
    contentLength: response.ContentLength,
    etag: response.ETag,
    lastModified: response.LastModified
  }
}

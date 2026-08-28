import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { env } from '@/config/env.js'
import { SIGNED_URL_EXPIRATION } from '@/constants/index.js'
import { authorizeResource } from '@/lib/authorizeResource.js'
import type { AppAbility } from '@/lib/casl-prisma.js'
import { s3Client } from '@/lib/s3.js'
import { sanitizeFilename } from '@/utils/sanitizeFilename.js'

export const UploadService = {
  getPresignedUrl: (
    folder: string,
    request: Request,
    filename: string,
    contentType: string,
    ability: AppAbility
  ) =>
    authorizeResource(
      ability.can('create', 'Post'),
      'Cannot upload files',
      async () => {
        const key = `${folder}/${Date.now()}-${sanitizeFilename(filename)}`

        const command = new PutObjectCommand({
          Bucket: env.S3_BUCKET_NAME,
          Key: key,
          ContentType: contentType
        })

        const presignedUrl = await getSignedUrl(s3Client, command, {
          expiresIn: SIGNED_URL_EXPIRATION
        })

        const host = request.headers.get('host')
        const protocol = request.headers.get('x-forwarded-proto') ?? 'http'
        const backendUrl = `${protocol}://${host}`

        const publicUrl = `${backendUrl}/api/v1/images/${key}`

        return { presignedUrl, publicUrl, key }
      }
    )
}

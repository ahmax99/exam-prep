import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'

import { IMAGE_CACHE_MAX_AGE } from '@/constants/index.js'
import { errorHandler } from '@/error/lib/errorHandler.js'
import { handleApiError } from '@/error/utils/handleApiError.js'
import { imagePlugin } from '@/modules/images/image.plugin.js'

const setImageResponseHeaders = (
  headers: Record<string, string | number>,
  result: {
    contentType: string
    contentLength?: number
    etag?: string
    lastModified?: Date
  }
) => {
  headers['Content-Type'] = result.contentType
  headers['Cache-Control'] = `public, max-age=${IMAGE_CACHE_MAX_AGE}, immutable`

  if (result.contentLength)
    headers['Content-Length'] = result.contentLength.toString()
  if (result.etag) headers.ETag = result.etag
  if (result.lastModified)
    headers['Last-Modified'] = result.lastModified.toUTCString()
}

export const imageController = new Elysia({ prefix: '/images' })
  .use(imagePlugin)
  .use(errorHandler)
  .use(openapi())
  .get(
    '/*',
    async ({ params, imageService, set }) => {
      const imagePath = params['*']

      if (!imagePath) {
        set.status = 400
        return { error: 'Image path is required' }
      }

      const result = await handleApiError(imageService.getImage(imagePath))

      if (!result.body) {
        set.status = 404
        return { error: 'Image not found' }
      }

      setImageResponseHeaders(set.headers, result)

      return result.body
    },
    {
      detail: {
        summary: 'Get image from S3',
        description: 'Proxy endpoint to stream images from private S3 bucket',
        tags: ['Images']
      }
    }
  )

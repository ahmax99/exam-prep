import { type NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/features/error/lib/AppError'
import { IMAGE_CACHE_MAX_AGE } from '@/features/media/constants'
import { imagePathSchema } from '@/features/media/schemas/image.schema'
import { fetchImage } from '@/features/media/server/api'
import { withRequestLogging } from '@/lib/requestLogging'

export const GET = withRequestLogging(async (request: NextRequest) => {
  const parsedPath = imagePathSchema.safeParse(
    request.nextUrl.searchParams.get('path')
  )
  if (!parsedPath.success)
    throw new AppError('BAD_REQUEST', 'Invalid or missing image path')

  const image = await fetchImage(parsedPath.data)

  const headers = new Headers({
    'Content-Type': image.contentType,
    'Cache-Control': `public, max-age=${IMAGE_CACHE_MAX_AGE}, immutable`
  })

  if (image.contentLength)
    headers.set('Content-Length', image.contentLength.toString())
  if (image.etag) headers.set('ETag', image.etag)
  if (image.lastModified)
    headers.set('Last-Modified', image.lastModified.toUTCString())

  return new NextResponse(image.body, { headers })
})

import { type NextRequest, NextResponse } from 'next/server'

import { IMAGE_CACHE_MAX_AGE } from '@/features/media/constants'
import { imagePathSchema } from '@/features/media/schemas/image.schema'
import { fetchImage } from '@/features/media/server/api'
import { parseInput } from '@/lib/requestInput'
import { withRequestLogging } from '@/lib/requestLogging'

export const GET = withRequestLogging(async (request: NextRequest) => {
  const image = await fetchImage(
    parseInput(
      imagePathSchema,
      request.nextUrl.searchParams.get('path'),
      'Invalid or missing image path'
    )
  )

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

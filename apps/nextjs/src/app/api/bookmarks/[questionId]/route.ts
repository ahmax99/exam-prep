import { type NextRequest, NextResponse } from 'next/server'

import {
  bookmarkBodySchema,
  bookmarkQuestionIdSchema
} from '@/features/bookmarks/schemas/bookmark.schema'
import { removeBookmark, setBookmark } from '@/features/bookmarks/server/api'
import { parseInput, parseJsonBody } from '@/lib/requestInput'
import { withRequestLogging } from '@/lib/requestLogging'

interface BookmarkRouteContext {
  params: Promise<{ questionId: string }>
}

const parseQuestionId = async ({ params }: BookmarkRouteContext) =>
  parseInput(
    bookmarkQuestionIdSchema,
    (await params).questionId,
    'Invalid question id'
  )

export const PUT = withRequestLogging<BookmarkRouteContext>(
  async (request: NextRequest, context) => {
    const questionId = await parseQuestionId(context)
    const body = await parseJsonBody(
      request,
      bookmarkBodySchema,
      'Invalid bookmark payload'
    )
    return NextResponse.json(await setBookmark({ questionId, ...body }))
  }
)

export const DELETE = withRequestLogging<BookmarkRouteContext>(
  async (_request: NextRequest, context) => {
    await removeBookmark(await parseQuestionId(context))
    return new NextResponse(null, { status: 204 })
  }
)

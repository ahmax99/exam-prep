import { type NextRequest, NextResponse } from 'next/server'

import {
  bookmarkBodySchema,
  bookmarkQuestionIdSchema
} from '@/features/bookmarks/schemas/bookmark.schema'
import { removeBookmark, setBookmark } from '@/features/bookmarks/server/api'
import { AppError } from '@/features/error/lib/AppError'
import { catchSyncError } from '@/features/error/utils/catchError'
import { withRequestLogging } from '@/lib/requestLogging'

type BookmarkRouteContext = { params: Promise<{ questionId: string }> }

const parseQuestionId = async (context: BookmarkRouteContext) => {
  const parsed = bookmarkQuestionIdSchema.safeParse(
    (await context.params).questionId
  )
  if (!parsed.success) throw new AppError('BAD_REQUEST', 'Invalid question id')
  return parsed.data
}

// A bodyless PUT is a legitimate "just bookmark it" call, so an empty body
// becomes `{}` rather than a parse failure; a non-empty unparseable body is
// still BAD_REQUEST.
const readJsonBody = async (request: NextRequest): Promise<unknown> => {
  const text = await request.text()
  if (text.length === 0) return {}

  return catchSyncError(() => JSON.parse(text) as unknown).match(
    (value) => value,
    () => {
      throw new AppError('BAD_REQUEST', 'Invalid JSON in request body')
    }
  )
}

export const PUT = withRequestLogging<BookmarkRouteContext>(
  async (request: NextRequest, context) => {
    const questionId = await parseQuestionId(context)
    const rawBody = await readJsonBody(request)

    const parsedBody = bookmarkBodySchema.safeParse(rawBody)
    if (!parsedBody.success)
      throw new AppError('BAD_REQUEST', 'Invalid bookmark payload')

    const result = await setBookmark({ questionId, ...parsedBody.data })
    if (result.isErr()) throw result.error

    return NextResponse.json(result.value)
  }
)

export const DELETE = withRequestLogging<BookmarkRouteContext>(
  async (_request: NextRequest, context) => {
    const questionId = await parseQuestionId(context)

    const result = await removeBookmark(questionId)
    if (result.isErr()) throw result.error

    return new NextResponse(null, { status: 204 })
  }
)

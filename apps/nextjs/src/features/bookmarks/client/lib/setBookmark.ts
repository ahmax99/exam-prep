import ky from 'ky'

import { bookmarkSchema } from '@/features/bookmarks/schemas/bookmark.schema'
import { catchAsyncError } from '@/features/error/utils/catchError'
import { parseResponse } from '@/features/error/utils/parseResponse'

interface SetBookmarkParams {
  questionId: string
  note?: string | null
}

export const setBookmark = ({ questionId, note }: SetBookmarkParams) =>
  catchAsyncError(
    ky.put(`/api/bookmarks/${questionId}`, { json: { note } }).json<unknown>()
  ).andThen(parseResponse(bookmarkSchema, 'Unexpected bookmark response'))

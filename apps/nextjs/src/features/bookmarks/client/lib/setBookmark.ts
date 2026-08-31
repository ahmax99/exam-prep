import ky from 'ky'
import { errAsync, okAsync } from 'neverthrow'

import {
  type Bookmark,
  bookmarkSchema
} from '@/features/bookmarks/schemas/bookmark.schema'
import { AppError } from '@/features/error/lib/AppError'
import { catchAsyncError } from '@/features/error/utils/catchError'

interface SetBookmarkParams {
  questionId: string
  note?: string | null
}

export const setBookmark = ({ questionId, note }: SetBookmarkParams) =>
  catchAsyncError(
    ky.put(`/api/bookmarks/${questionId}`, { json: { note } }).json<unknown>()
  ).andThen((body) => {
    const parsed = bookmarkSchema.safeParse(body)
    return parsed.success
      ? okAsync<Bookmark, AppError>(parsed.data)
      : errAsync<Bookmark, AppError>(
          new AppError('INTERNAL_ERROR', 'Unexpected bookmark response')
        )
  })

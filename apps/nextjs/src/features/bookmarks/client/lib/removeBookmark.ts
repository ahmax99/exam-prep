import ky from 'ky'

import { catchAsyncError } from '@/features/error/utils/catchError'

export const removeBookmark = (questionId: string) =>
  catchAsyncError(
    ky.delete(`/api/bookmarks/${questionId}`).then(() => undefined)
  )

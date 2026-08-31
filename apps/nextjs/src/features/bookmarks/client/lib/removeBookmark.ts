import ky from 'ky'

import { catchAsyncError } from '@/features/error/utils/catchError'

// 204 has no body — do not call `.json()` on the response.
export const removeBookmark = (questionId: string) =>
  catchAsyncError(
    ky.delete(`/api/bookmarks/${questionId}`).then(() => undefined)
  )

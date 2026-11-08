import { notFound } from 'next/navigation'

import { catchAsyncError } from './catchError'

// A NOT_FOUND AppError renders the 404 page; anything else reaches error.tsx.
export const orNotFound = async <T>(promise: Promise<T>): Promise<T> => {
  const result = await catchAsyncError(promise)
  if (result.isOk()) return result.value
  if (result.error.code === 'NOT_FOUND') notFound()
  throw result.error
}

import type { AppError } from '../../lib/AppError'
import { catchAsyncError } from '../../utils/catchError'

export const handleClientError = async <T>(
  promise: Promise<T>,
  onError: (error: AppError) => void,
  onSuccess?: (value: T) => void
) =>
  catchAsyncError(promise).match(
    (value) => {
      onSuccess?.(value)
      return { error: false, value } as const
    },
    (error) => {
      onError(error)
      return { error: true, message: error.message, value: undefined } as const
    }
  )

export const handleClientAuthError = async <T>(
  promise: Promise<T>,
  onError: (error: AppError) => void,
  onSuccess?: (value: T) => void
) =>
  catchAsyncError(promise).match(
    (value) => {
      onSuccess?.(value)
      return { error: null } as const
    },
    (error) => {
      onError(error)
      return { error: { message: error.message } } as const
    }
  )

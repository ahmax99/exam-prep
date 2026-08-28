import { Result, ResultAsync } from 'neverthrow'

import { captureError } from '@/features/error-tracking/utils/captureError'

import { mapToAppError } from '../lib/mapToAppError'

export const catchSyncError = <T>(fn: () => T) =>
  Result.fromThrowable(fn, mapToAppError)()

export const catchAsyncError = <T>(promise: Promise<T>) =>
  ResultAsync.fromPromise(promise, mapToAppError).mapErr((error) => {
    captureError(error)
    return error
  })

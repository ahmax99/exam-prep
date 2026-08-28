import { Result, ResultAsync } from 'neverthrow'

import { mapToAppError } from '../lib/mapToAppError'

export const catchAsyncError = <T>(promise: Promise<T>) =>
  ResultAsync.fromPromise(promise, mapToAppError)

export const catchSyncError = <T>(fn: () => T) =>
  Result.fromThrowable(fn, mapToAppError)()

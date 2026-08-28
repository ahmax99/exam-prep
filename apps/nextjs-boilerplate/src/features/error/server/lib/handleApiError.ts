import type { ResultAsync } from 'neverthrow'

import type { AppError } from '../../lib/AppError'

export const handleApiError = async <T>(
  resultAsync: ResultAsync<T, AppError>
) => {
  const result = await resultAsync

  if (result.isErr()) throw result.error

  return result.value
}

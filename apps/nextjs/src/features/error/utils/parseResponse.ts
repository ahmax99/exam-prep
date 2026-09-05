import { errAsync, okAsync, type ResultAsync } from 'neverthrow'
import type { ZodType } from 'zod'

import { AppError } from '../lib/AppError'

export const parseResponse =
  <T>(schema: ZodType<T>, message: string) =>
  (body: unknown): ResultAsync<T, AppError> => {
    const parsed = schema.safeParse(body)
    return parsed.success
      ? okAsync(parsed.data)
      : errAsync(new AppError('INTERNAL_ERROR', message))
  }

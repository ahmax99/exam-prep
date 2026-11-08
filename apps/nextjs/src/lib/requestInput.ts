import type { NextRequest } from 'next/server'

import type { ZodType } from 'zod'

import { AppError } from '@/features/error/lib/AppError'
import { catchSyncError } from '@/features/error/utils/catchError'

// Throws a 400 AppError; withRequestLogging turns it into the response.
export const parseInput = <T>(
  schema: ZodType<T>,
  value: unknown,
  message: string
): T => {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new AppError('BAD_REQUEST', message)
  return parsed.data
}

const readJson = async (request: NextRequest): Promise<unknown> => {
  const text = await request.text()
  // An empty body reads as {}, so a schema of optional fields accepts it.
  if (text.length === 0) return {}

  return catchSyncError((): unknown => JSON.parse(text)).match(
    (value) => value,
    () => {
      throw new AppError('BAD_REQUEST', 'Invalid JSON in request body')
    }
  )
}

export const parseJsonBody = async <T>(
  request: NextRequest,
  schema: ZodType<T>,
  message: string
): Promise<T> => parseInput(schema, await readJson(request), message)

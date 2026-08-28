import { HTTPError } from 'ky'

import { ERROR_DEFINITIONS, ErrorCode } from '../constants/errorDefinition'

import { AppError } from './AppError'

const STATUS_TO_CODE = Object.fromEntries(
  Object.entries(ERROR_DEFINITIONS).map(([code, { status }]) => [status, code])
) as Partial<Record<number, ErrorCode>>

const stringifyUnknownError = (error: unknown) => {
  switch (typeof error) {
    case 'string':
      return error
    case 'object':
      if (error === null) return 'null'
      return JSON.stringify(error)
    default:
      return String(error)
  }
}

export const mapToAppError = (error: unknown) => {
  switch (true) {
    case error instanceof AppError:
      return error
    case error instanceof HTTPError:
      return new AppError(
        STATUS_TO_CODE[error.response.status] ?? 'INTERNAL_ERROR'
      )
    case error instanceof Error:
      return new AppError('INTERNAL_ERROR', error.message)
    default:
      return new AppError('INTERNAL_ERROR', stringifyUnknownError(error))
  }
}

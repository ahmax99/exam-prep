import { ERROR_DEFINITIONS, type ErrorCode } from '@shared/config'

export class AppError extends Error {
  readonly status: number
  readonly code: ErrorCode

  constructor(code: ErrorCode, message?: string) {
    const definition = ERROR_DEFINITIONS[code]
    super(message ?? definition.message)
    this.code = code
    this.status = definition.status
  }
}

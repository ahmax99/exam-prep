'use client'

import { ERROR_DEFINITIONS, type ErrorCode } from '@shared/config'
import { toast } from 'sonner'

import type { AppError } from '../../lib/AppError'
import { useErrorStore } from '../stores/useErrorStore'

const ERROR_DISPLAY: Record<ErrorCode, 'toast' | 'screen'> = {
  NOT_FOUND: 'toast',
  FORBIDDEN: 'toast',
  UNAUTHORIZED: 'toast',
  BAD_REQUEST: 'toast',
  RATE_LIMIT_EXCEEDED: 'toast',
  INTERNAL_ERROR: 'screen'
}

export const useErrorHandler = () => (error: AppError | string) => {
  const { setError } = useErrorStore.getState()
  if (typeof error === 'string') return toast.error(error)

  if (ERROR_DISPLAY[error.code] === 'toast')
    return toast.error(error.message ?? ERROR_DEFINITIONS[error.code].message)

  setError(error)
}

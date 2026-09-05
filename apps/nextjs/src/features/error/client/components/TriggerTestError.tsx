'use client'

import { useEffect } from 'react'

import { env } from '@/config/env'
import { useErrorStore } from '@/features/error/client/stores/useErrorStore'
import { AppError } from '@/features/error/lib/AppError'

export const TriggerTestError = () => {
  useEffect(() => {
    if (env.NODE_ENV === 'production') return

    useErrorStore
      .getState()
      .setError(
        new AppError('INTERNAL_ERROR', 'Test error for styling preview')
      )
  }, [])

  return null
}

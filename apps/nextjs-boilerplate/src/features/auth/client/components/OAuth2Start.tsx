'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import { safeRelativePath } from '@/features/auth/utils/redirect'

export const OAuth2Start = () => {
  const searchParams = useSearchParams()

  useEffect(() => {
    const callbackUrl = safeRelativePath(searchParams.get('callbackUrl'))
    const loginUrl = callbackUrl
      ? `/api/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : '/api/auth/login'

    globalThis.location.href = loginUrl
  }, [searchParams])

  return null
}

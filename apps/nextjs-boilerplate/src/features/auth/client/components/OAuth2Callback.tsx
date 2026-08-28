'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function OAuth2Callback() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const queryString = searchParams.toString()
    globalThis.location.href = `/api/auth/callback?${queryString}`
  }, [searchParams])

  return null
}

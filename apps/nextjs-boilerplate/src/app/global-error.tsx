'use client'

import NextError from 'next/error'
import { useEffect } from 'react'

import { captureError } from '@/features/error-tracking/utils/captureError'

interface GlobalErrorProps {
  error: Error & { digest?: string }
}

export default function GlobalError({ error }: Readonly<GlobalErrorProps>) {
  useEffect(() => {
    captureError(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  )
}

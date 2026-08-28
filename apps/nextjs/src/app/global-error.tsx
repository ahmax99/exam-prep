'use client'

import NextError from 'next/error'

interface GlobalErrorProps {
  error: Error & { digest?: string }
}

export default function GlobalError({
  error: _error
}: Readonly<GlobalErrorProps>) {
  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  )
}

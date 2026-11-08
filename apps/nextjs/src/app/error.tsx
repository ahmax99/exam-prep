'use client'

import Link from 'next/link'

import { Button } from '@/components/atoms'

interface ErrorPageProps {
  error: Error & { digest?: string }
  retry: () => void
}

// Server-side failures are logged once, in instrumentation.ts.
export default function ErrorPage({ error, retry }: Readonly<ErrorPageProps>) {
  return (
    <main className="bg-background text-foreground flex min-h-[70dvh] flex-col items-center justify-center px-8 text-center">
      <p className="text-destructive font-mono text-[13px] tracking-[-0.04em]">
        500
      </p>
      <h1 className="mt-3.5 max-w-[24ch] text-[30px] leading-[1.15] font-semibold tracking-[-0.025em] text-balance">
        Something went wrong loading this page
      </h1>
      <p className="text-prose-foreground mt-3.5 max-w-[46ch] text-[15px] leading-[1.6]">
        Your answers are saved as you submit them, so nothing you finished is
        lost. Trying again usually clears it.
      </p>
      <div className="mt-[26px] flex flex-wrap justify-center gap-3">
        <Button variant="brand" onClick={retry}>
          Try again
        </Button>
        <Button
          nativeButton={false}
          render={<Link href="/" />}
          variant="outline"
        >
          Back to certifications
        </Button>
      </div>
      {error.digest && (
        <p className="text-muted-foreground mt-[34px] font-mono text-[10px]">
          ref {error.digest}
        </p>
      )}
    </main>
  )
}

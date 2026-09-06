'use client'

import '../styles/globals.css'
import { mono, sans } from '@/config/fonts'
import { cn } from '@/utils/mergeClass'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/* This page replaces the root layout, so it has no header, rail or tab bar to
   lean on — and no theme provider, which is why the dark variant switches on
   the OS preference rather than the .dark class. Someone who chose light mode
   on a dark OS sees the dark variant here; acceptable for a page nobody
   should see twice. */
const darkOverride = `
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0e1418;
    --foreground: #eef2f4;
    --muted-foreground: #9aa8b0;
    --prose-foreground: #cfd8dd;
    --destructive: #f4736c;
    --border: #263038;
    --outline: #3a4650;
    --brand: #4fc3e8;
    --brand-foreground: #062430;
  }
}
`

export default function GlobalError({
  error,
  reset
}: Readonly<GlobalErrorProps>) {
  return (
    <html className={cn(sans.variable, mono.variable)} lang="en">
      <body>
        <style>{darkOverride}</style>
        <main className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center px-8 py-14 text-center">
          {/* Set inline rather than importing Logo: nothing from the app
              shell is available on this page. */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-medium tracking-[-0.04em]">
              exam<span className="text-muted-foreground">-</span>prep
            </span>
            <span
              aria-hidden="true"
              className="bg-brand block h-3.5 w-1.5"
              data-slot="logo-cursor"
            />
          </div>

          <p className="text-destructive mt-10 font-mono text-[13px] tracking-[-0.04em]">
            500
          </p>
          <h1 className="mt-3.5 max-w-[24ch] text-[30px] leading-[1.15] font-semibold tracking-[-0.025em] text-balance">
            Something broke on our side
          </h1>
          <p className="text-prose-foreground mt-3.5 max-w-[46ch] text-[15px] leading-[1.6]">
            Your answers are saved as you submit them, so nothing you finished
            is lost. Reloading usually clears it.
          </p>

          <div className="mt-[26px] flex flex-wrap justify-center gap-3">
            <button
              className="bg-brand text-brand-foreground inline-flex min-h-11 cursor-pointer items-center rounded-[4px] px-[22px] text-[15px] font-semibold"
              type="button"
              onClick={reset}
            >
              Reload
            </button>
            <a
              className="border-outline inline-flex min-h-11 items-center rounded-[4px] border px-[22px] text-[15px] font-medium"
              href="/"
            >
              Back to certifications
            </a>
          </div>

          {error.digest && (
            <p className="text-muted-foreground mt-[34px] font-mono text-[10px]">
              ref {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  )
}

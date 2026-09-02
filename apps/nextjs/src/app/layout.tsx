import { Geist, Geist_Mono } from 'next/font/google'

import '../styles/globals.css'

import { DynamicMarker } from '@/components/layout'
import { ThemedToaster } from '@/features/theme/client/components/ThemedToaster'
import { ThemeProvider } from '@/features/theme/client/providers/ThemeProvider'
import { cn } from '@/utils/mergeClass'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export { metadata } from '@/features/metadata/constants'

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      className={cn(geistSans.variable, geistMono.variable)}
      data-scroll-behavior="smooth"
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <a
          className="bg-primary text-primary-foreground focus-visible:ring-ring/50 sr-only rounded-md px-4 py-2 text-sm font-medium focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:ring-[3px]"
          href="#main-content"
        >
          Skip to content
        </a>
        <ThemeProvider>
          {children}
          <ThemedToaster />
          <DynamicMarker />
        </ThemeProvider>
      </body>
    </html>
  )
}

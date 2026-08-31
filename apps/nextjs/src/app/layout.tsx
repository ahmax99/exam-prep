import { Geist, Geist_Mono } from 'next/font/google'

import '../styles/globals.css'
import { Toaster } from 'sonner'

import { DynamicMarker } from '@/components/layout'
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
      className={cn('dark', geistSans.variable, geistMono.variable)}
      data-scroll-behavior="smooth"
      lang="en"
      suppressHydrationWarning
    >
      <body>
        {children}
        <Toaster position="bottom-right" richColors />
        <DynamicMarker />
      </body>
    </html>
  )
}

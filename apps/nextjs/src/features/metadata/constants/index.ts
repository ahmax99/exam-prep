import type { Metadata } from 'next'

const TITLE = 'Next.js Boilerplate'
const DESCRIPTION = 'A production-ready Next.js boilerplate'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: TITLE,
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION
  }
}

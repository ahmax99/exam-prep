import type { Metadata } from 'next'

const TITLE = 'Exam Prep'
const DESCRIPTION =
  'A spaced-recall drill tool for certification exam prep. Pick a scope, answer a queue of questions, and watch per-objective mastery move.'

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

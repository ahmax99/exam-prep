import { Martian_Mono, Space_Grotesk } from 'next/font/google'

export const sans = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin']
})

export const mono = Martian_Mono({
  variable: '--font-martian-mono',
  subsets: ['latin'],
  weight: ['300', '400', '500']
})

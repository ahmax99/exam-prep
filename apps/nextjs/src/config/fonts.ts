import { Martian_Mono, Space_Grotesk } from 'next/font/google'

/* Shared because global-error.tsx renders its own <html> and so has to apply
   the font variables itself — the root layout is gone by the time it runs. */
export const sans = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin']
})

export const mono = Martian_Mono({
  variable: '--font-martian-mono',
  subsets: ['latin'],
  weight: ['300', '400', '500']
})

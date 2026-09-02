'use client'

import { ThemeProvider as NextThemeProvider } from 'next-themes'

export const ThemeProvider = ({
  children
}: Readonly<{ children: React.ReactNode }>) => (
  <NextThemeProvider
    attribute="class"
    defaultTheme="system"
    disableTransitionOnChange
    enableSystem
  >
    {children}
  </NextThemeProvider>
)

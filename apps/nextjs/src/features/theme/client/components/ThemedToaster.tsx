'use client'

import { useTheme } from 'next-themes'
import { Toaster } from 'sonner'

// sonner defaults to its own `light` theme when no `theme` prop is passed —
// this makes toasts follow the app's resolved theme instead.
export const ThemedToaster = () => {
  const { resolvedTheme } = useTheme()

  return (
    <Toaster
      position="bottom-right"
      richColors
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
    />
  )
}

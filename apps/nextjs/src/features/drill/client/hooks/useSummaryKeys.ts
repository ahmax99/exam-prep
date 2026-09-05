'use client'

import { useEffect, useRef } from 'react'

import { isTextEntryTarget } from '@/features/drill/client/lib/isTextEntryTarget'

interface SummaryKeyHandlers {
  onRetry: () => void
  onWeakSpots: (() => void) | null
}

export const useSummaryKeys = (handlers: SummaryKeyHandlers) => {
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (event.isComposing) return
      if (isTextEntryTarget(event.target)) return

      if (event.repeat) return

      if (!/^[a-z]$/i.test(event.key)) return
      const letter = event.key.toUpperCase()
      const current = handlersRef.current

      if (letter === 'R') {
        event.preventDefault()
        current.onRetry()
      } else if (letter === 'W' && current.onWeakSpots) {
        event.preventDefault()
        current.onWeakSpots()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}

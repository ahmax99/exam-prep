'use client'

import { useEffect, useRef } from 'react'

interface SummaryKeyHandlers {
  onRetry: () => void
  onWeakSpots: (() => void) | null
}

const isTextEntryTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  target.closest(
    'input:not([type=radio]):not([type=checkbox]), textarea, select, [contenteditable="true"]'
  ) !== null

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
      // OS key-repeat would otherwise fire the handler many times per hold.
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

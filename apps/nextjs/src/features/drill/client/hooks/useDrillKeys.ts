'use client'

import { useEffect, useRef } from 'react'

interface DrillKeyHandlers {
  optionLetters: string[]
  onLetter: (letter: string) => void
  onPrimary: () => void
  onSkip: () => void
  onBookmark: () => void
}

const isTextEntryTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  target.closest(
    'input:not([type=radio]):not([type=checkbox]), textarea, select, [contenteditable="true"]'
  ) !== null

export const useDrillKeys = (handlers: DrillKeyHandlers) => {
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (event.isComposing) return
      if (isTextEntryTarget(event.target)) return

      const current = handlersRef.current

      if (event.key === 'Enter') {
        event.preventDefault()
        current.onPrimary()
        return
      }

      if (!/^[a-z]$/i.test(event.key)) return
      const letter = event.key.toUpperCase()

      if (current.optionLetters.includes(letter)) {
        event.preventDefault()
        current.onLetter(letter)
      } else if (letter === 'S') {
        event.preventDefault()
        current.onSkip()
      } else if (letter === 'B') {
        event.preventDefault()
        current.onBookmark()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}

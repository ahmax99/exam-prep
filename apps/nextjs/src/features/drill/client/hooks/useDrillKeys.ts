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
      // OS key-repeat would otherwise let a held Enter/S/letter fire the
      // handler many times (e.g. skip past several questions unintentionally).
      if (event.repeat) return

      const current = handlersRef.current

      if (event.key === 'Enter') {
        event.preventDefault()
        current.onPrimary()
        return
      }

      if (!/^[a-z]$/i.test(event.key)) return
      const letter = event.key.toUpperCase()

      // B is reserved for the bookmark toggle even when the question has a
      // lettered "B" option (plan Decision 4: the key always means bookmark).
      if (letter === 'B') {
        event.preventDefault()
        current.onBookmark()
      } else if (current.optionLetters.includes(letter)) {
        event.preventDefault()
        current.onLetter(letter)
      } else if (letter === 'S') {
        event.preventDefault()
        current.onSkip()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}

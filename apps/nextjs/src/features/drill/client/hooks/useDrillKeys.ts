'use client'

import { useEffect, useRef, type RefObject } from 'react'

interface DrillKeyHandlers {
  containerRef: RefObject<HTMLElement | null>
  optionLetters: string[]
  onLetter: (letter: string) => void
  onPrimary: () => void
  onSkip: () => void
  onSkippedList: () => void
  onBookmark: () => void
  onSelfGradeHadIt?: () => void
  onSelfGradeMissedIt?: () => void
  onPrevious?: () => void
  onHelp?: () => void
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

      if (event.repeat) return

      const current = handlersRef.current

      if (!current.containerRef.current?.contains(document.activeElement))
        return

      if (event.key === 'Enter') {
        event.preventDefault()
        current.onPrimary()
        return
      }

      if (event.key === 'Backspace') {
        event.preventDefault()
        current.onPrevious?.()
        return
      }

      if (event.key === '?') {
        event.preventDefault()
        current.onHelp?.()
        return
      }

      if (!/^[a-z]$/i.test(event.key)) return
      const letter = event.key.toUpperCase()

      if (current.optionLetters.includes(letter)) {
        event.preventDefault()
        current.onLetter(letter)
        return
      }

      switch (letter) {
        case 'B':
          event.preventDefault()
          current.onBookmark()
          break
        case 'S':
          event.preventDefault()
          current.onSkip()
          break
        case 'L':
          event.preventDefault()
          current.onSkippedList()
          break
        case 'Y':
          event.preventDefault()
          current.onSelfGradeHadIt?.()
          break
        case 'N':
          event.preventDefault()
          current.onSelfGradeMissedIt?.()
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}

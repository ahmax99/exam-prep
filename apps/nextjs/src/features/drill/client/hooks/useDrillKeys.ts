'use client'

import { useEffect, useRef, type RefObject } from 'react'

interface DrillKeyHandlers {
  containerRef: RefObject<HTMLElement | null>
  optionLetters: string[]
  onLetter: (letter: string) => void
  onPrimary: () => void
  onSkip: () => void
  onBookmark: () => void
  onSelfGradeHadIt?: () => void
  onSelfGradeMissedIt?: () => void
  onPrevious?: () => void
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

      // A screen reader's browse-mode quick-nav keys (b, s, y, n, ...) move
      // its virtual cursor without moving real DOM focus, so gating on focus
      // containment — not just "not a text field" — keeps those keys free
      // for AT navigation until the user has actually focused into the card.
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

      if (!/^[a-z]$/i.test(event.key)) return
      const letter = event.key.toUpperCase()

      if (current.optionLetters.includes(letter)) {
        event.preventDefault()
        current.onLetter(letter)
        return
      }

      switch (letter) {
        case 'B':
          // B only bookmarks when the question has no lettered B option —
          // otherwise the visible option wins.
          event.preventDefault()
          current.onBookmark()
          break
        case 'S':
          event.preventDefault()
          current.onSkip()
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

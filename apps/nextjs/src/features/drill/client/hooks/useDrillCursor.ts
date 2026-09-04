'use client'

import { useState } from 'react'

interface UseDrillCursorParams {
  startIndex: number
  frontier: number
  questionCount: number
  onFinish: () => void
}

/**
 * Where the run is and how far it has been walked.
 *
 * `startIndex` and `frontier` are read once: a route param or `?q=` change
 * remounts the whole page tree, so neither changes under a live instance — and
 * in-card jumps move the cursor directly rather than the URL.
 *
 * `furthestIndex` only ever grows. That is what lets a jump back to a skipped
 * question leave the questions after it still counted as skipped.
 */
export const useDrillCursor = ({
  startIndex,
  frontier,
  questionCount,
  onFinish
}: UseDrillCursorParams) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const [furthestIndex, setFurthestIndex] = useState(() =>
    Math.max(frontier, startIndex)
  )
  // Suppresses the live-region announcement on mount; only a real
  // forward/backward navigation should announce anything.
  const [hasNavigated, setHasNavigated] = useState(false)

  const goNext = () => {
    setHasNavigated(true)
    setFurthestIndex((current) => Math.max(current, currentIndex + 1))
    if (currentIndex + 1 >= questionCount) {
      onFinish()
      return
    }
    setCurrentIndex((current) => current + 1)
  }

  const goPrevious = () => {
    if (currentIndex === 0) return
    setHasNavigated(true)
    setCurrentIndex((current) => current - 1)
  }

  const jumpTo = (index: number) => {
    setHasNavigated(true)
    setCurrentIndex(index)
  }

  return {
    currentIndex,
    furthestIndex,
    hasNavigated,
    goNext,
    goPrevious,
    jumpTo
  }
}

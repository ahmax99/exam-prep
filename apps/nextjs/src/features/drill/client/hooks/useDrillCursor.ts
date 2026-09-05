'use client'

import { useState } from 'react'

interface UseDrillCursorParams {
  startIndex: number
  frontier: number
  questionCount: number
  onFinish: () => void
}

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

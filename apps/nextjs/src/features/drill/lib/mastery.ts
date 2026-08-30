import type { MasteryState } from '@/lib/prisma'

export interface MasteryUpdate {
  state: MasteryState
  correctStreak: number
}

// Two consecutive corrects promote SHAKY to MASTERED; any wrong resets to WRONG/0.
const MASTERY_STREAK = 2

export const nextMastery = (
  current: { state: MasteryState; correctStreak: number } | null,
  isCorrect: boolean
): MasteryUpdate => {
  if (!isCorrect) return { state: 'WRONG', correctStreak: 0 }

  const correctStreak = (current?.correctStreak ?? 0) + 1
  return {
    state: correctStreak >= MASTERY_STREAK ? 'MASTERED' : 'SHAKY',
    correctStreak
  }
}

import { create } from 'zustand'

import type { AppError } from '../../lib/AppError'

interface ErrorStore {
  error?: AppError
  setError: (error: AppError | undefined) => void
  clearError: () => void
}

export const useErrorStore = create<ErrorStore>((set) => ({
  error: undefined,
  setError: (error) => set({ error }),
  clearError: () => set({ error: undefined })
}))

import { DEFAULT_RUN_LIMIT, MAX_RUN_LIMIT } from '@/features/drill/constants'

// The only number a "Drill …" control may print: a run can never hold more
// than the questions in scope, the requested size, or MAX_RUN_LIMIT.
export const resolveRunSize = (
  available: number,
  requested: number = DEFAULT_RUN_LIMIT
) => Math.max(0, Math.min(available, requested, MAX_RUN_LIMIT))

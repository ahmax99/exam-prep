import ky from 'ky'

import { catchAsyncError } from '@/features/error/utils/catchError'

export const deleteRun = (runId: string) =>
  catchAsyncError(ky.delete(`/api/drill/runs/${runId}`).then(() => undefined))

import { NextResponse } from 'next/server'

import {
  getCertification,
  getCertifications
} from '@/features/catalog/server/api'
import { catchAsyncError } from '@/features/error/utils/catchError'
import { getDashboard } from '@/features/progress/server/api'

export const dynamic = 'force-dynamic'

const describe = async <T>(label: string, run: () => Promise<T>) => {
  const result = await catchAsyncError(run())
  return result.match(
    (value) => ({ label, ok: true, value }),
    (error) => ({
      label,
      ok: false,
      code: error.code,
      message: error.message,
      stack: error.stack
    })
  )
}

export const GET = async () =>
  NextResponse.json({
    checks: await Promise.all([
      describe('getCertifications', () => getCertifications()),
      describe('getCertification(lpic-1)', () => getCertification('lpic-1')),
      describe('getDashboard', () => getDashboard())
    ])
  })

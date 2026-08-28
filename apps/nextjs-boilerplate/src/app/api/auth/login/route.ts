import { type NextRequest, NextResponse } from 'next/server'

import { handleLogin } from '@/features/auth/server/services/auth'
import { withRequestLogging } from '@/lib/requestLogging'

export const GET = withRequestLogging(async (request: NextRequest) => {
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl')

  const { authUrl } = await handleLogin(callbackUrl ?? undefined)

  return NextResponse.redirect(authUrl)
})

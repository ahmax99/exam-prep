import { type NextRequest, NextResponse } from 'next/server'

import { env } from '@/config/env'
import type { CallbackParams } from '@/features/auth/schemas/auth.schema'
import { handleCallback } from '@/features/auth/server/services/auth'
import { withRequestLogging } from '@/lib/requestLogging'

export const GET = withRequestLogging(async (request: NextRequest) => {
  const params = Object.fromEntries(
    request.nextUrl.searchParams
  ) as CallbackParams

  // Behind CloudFront + Lambda Function URL, request.url reflects the Lambda hostname (CloudFront strips the viewer Host for OAC SigV4 signing).
  const publicUrl = new URL(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    env.BASE_URL
  )

  const { redirectUrl } = await handleCallback(publicUrl, params)

  return NextResponse.redirect(new URL(redirectUrl, env.BASE_URL))
})

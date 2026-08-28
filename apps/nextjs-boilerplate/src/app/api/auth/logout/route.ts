import { NextResponse } from 'next/server'

import { handleLogout } from '@/features/auth/server/services/auth'
import { withRequestLogging } from '@/lib/requestLogging'

export const GET = withRequestLogging(async () => {
  const { logoutUrl } = await handleLogout()

  return NextResponse.redirect(logoutUrl)
})
